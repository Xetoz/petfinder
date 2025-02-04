document.addEventListener('DOMContentLoaded', () => {
    let allPets = []; // Все объявления
    let currentPlacemarks = []; // Текущие метки на карте
    let map; // Объект карты
    let selectedCoordinates; // Выбранные координаты

    // Инициализация карты внутри ymaps.ready()
    ymaps.ready(() => {
        // Создаем карту
        map = new ymaps.Map('map', {
            center: [55.751574, 37.573856], // Координаты центра
            zoom: 12, // Масштаб
            controls: ['zoomControl'] // Элементы управления
        });

        // Обработчик клика по карте
        map.events.add('click', (e) => {
            selectedCoordinates = e.get('coords');
            document.getElementById('locationPicker').innerHTML = `
                <p>Выбрано местоположение:</p>
                <small>Широта: ${selectedCoordinates[0].toFixed(6)}</small><br>
                <small>Долгота: ${selectedCoordinates[1].toFixed(6)}</small>
            `;
        });

        // Первоначальная загрузка данных
        updateContent();
    });

    // Модальное окно
    const modal = document.getElementById('addModal');
    document.getElementById('addPetBtn').addEventListener('click', () => modal.style.display = 'block');
    document.querySelector('.close').addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => e.target === modal && (modal.style.display = 'none'));

    // Фильтры
    document.getElementById('filterType').addEventListener('change', updateContent);
    document.getElementById('filterStatus').addEventListener('change', updateContent);

    // Тестовые данные
    allPets = [
        {
            id: 1,
            title: "Потерян кот Барсик",
            description: "Рыжий, зеленые глаза, ошейник",
            type: "cat",
            status: "lost",
            lat: 55.751574,
            lon: 37.573856,
            photo: "https://placekitten.com/60/60"
        },
        {
            id: 2,
            title: "Найдена собака",
            description: "Овчарка, черно-рыжая",
            type: "dog",
            status: "found",
            lat: 55.758163,
            lon: 37.616488,
            photo: "https://placedog.net/60/60"
        }
    ];

    // Обработчик формы
    document.getElementById('petForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            type: document.getElementById('type').value,
            status: document.getElementById('status').value,
            photo: await readFile(document.getElementById('photo').files[0]),
            lat: selectedCoordinates[0],
            lon: selectedCoordinates[1]
        };

        allPets.push({ ...formData, id: Date.now() });
        updateContent();
        modal.style.display = 'none';
    });

    // Функции
    function updateContent() {
        if (map) { // Проверяем, что карта инициализирована
            updateMap();
        }
        updateTicker();
    }

    function updateMap() {
        // Удаляем старые метки
        currentPlacemarks.forEach(pm => map.geoObjects.remove(pm));
        currentPlacemarks = [];

        // Фильтрация
        const filteredPets = filterPets();

        // Добавляем новые метки
        filteredPets.forEach(pet => {
            const placemark = createPlacemark(pet);
            map.geoObjects.add(placemark);
            currentPlacemarks.push(placemark);
        });
    }

    function filterPets() {
        const type = document.getElementById('filterType').value;
        const status = document.getElementById('filterStatus').value;

        return allPets.filter(pet => {
            return (type === 'all' || pet.type === type) &&
                   (status === 'all' || pet.status === status);
        });
    }

    function createPlacemark(pet) {
        return new ymaps.Placemark([pet.lat, pet.lon], {
            hintContent: pet.title,
            balloonContent: `
                <div class="balloon">
                    <img src="${pet.photo}" alt="${pet.title}">
                    <h3>${pet.title}</h3>
                    <p>${pet.description}</p>
                    <p>Статус: ${pet.status === 'lost' ? 'Потерян' : 'Найден'}</p>
                </div>
            `
        }, {
            iconLayout: 'default#image',
            iconImageHref: getIcon(pet.type),
            iconImageSize: [40, 40],
            iconImageOffset: [-20, -40]
        });
    }

    function updateTicker() {
        const tickerContent = document.querySelector('.ticker-content');
        tickerContent.innerHTML = '';

        allPets.forEach(pet => {
            const item = document.createElement('div');
            item.className = `ticker-item ${pet.status}`;
            item.innerHTML = `
                <img src="${pet.photo}" alt="${pet.title}">
                <span>${pet.title}</span>
            `;

            // Взаимодействие
            item.addEventListener('click', () => {
                if (map) {
                    map.panTo([pet.lat, pet.lon], { flying: true });
                }
            });
            item.addEventListener('mouseenter', () => {
                tickerContent.style.animationPlayState = 'paused';
            });
            item.addEventListener('mouseleave', () => {
                tickerContent.style.animationPlayState = 'running';
            });

            tickerContent.appendChild(item);
        });
    }

    function getIcon(type) {
        const icons = {
            cat: 'https://img.icons8.com/color/48/cat.png',
            dog: 'https://img.icons8.com/color/48/dog.png',
            other: 'https://img.icons8.com/color/48/pets.png'
        };
        return icons[type] || icons.other;
    }

    function readFile(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
        });
    }
});