document.addEventListener('DOMContentLoaded', () => {
    let allPets = []; // Все объявления
    let currentPlacemarks = []; // Текущие метки на карте
    let map; // Объект основной карты
    let selectedCoordinates; // Выбранные координаты
    let modalMap = null; // Карта в модальном окне
    let modalMapMarker = null; // Маркер на карте модального окна

    // Инициализация основной карты
    ymaps.ready(() => {
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
    const addBtn = document.getElementById('addPetBtn');
    const closeBtn = document.querySelector('.close');
    const coordinatesInfo = document.getElementById('coordinatesInfo');

    // Открытие модального окна
    addBtn.addEventListener('click', () => {
        modal.style.display = 'block';
        initModalMap(); // Инициализация карты в модальном окне
    });

    // Закрытие модального окна
    closeBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => e.target === modal && closeModal());

    function closeModal() {
        modal.style.display = 'none';
        if (modalMap) {
            modalMap.destroy(); // Уничтожаем карту в модальном окне
            modalMap = null;
        }
        selectedCoordinates = null;
        coordinatesInfo.textContent = ''; // Очищаем информацию о координатах
    }

    // Инициализация карты в модальном окне
    function initModalMap() {
        if (!modalMap) {
            ymaps.ready(() => {
                modalMap = new ymaps.Map('modalMap', {
                    center: [55.751574, 37.573856],
                    zoom: 12,
                    controls: ['zoomControl']
                });
                // Обработчик клика по карте модального окна
                modalMap.events.add('click', (e) => {
                    selectedCoordinates = e.get('coords');
                    updateModalMapMarker(selectedCoordinates); // Обновляем маркер
                    updateCoordinatesInfo(); // Обновляем информацию о координатах
                });
            });
        }
    }

    // Обновление маркера на карте модального окна
    function updateModalMapMarker(coords) {
        if (modalMap) {
            if (modalMapMarker) {
                modalMap.geoObjects.remove(modalMapMarker); // Удаляем старый маркер
            }
            modalMapMarker = new ymaps.Placemark(coords, {}, {
                preset: 'islands#redIcon',
                draggable: true
            });
            // Обработчик перемещения маркера
            modalMapMarker.events.add('dragend', (e) => {
                selectedCoordinates = e.get('target').geometry.getCoordinates();
                updateCoordinatesInfo(); // Обновляем информацию о координатах
            });
            modalMap.geoObjects.add(modalMapMarker); // Добавляем новый маркер
            modalMap.panTo(coords, { flying: true }); // Центрируем карту
        }
    }

    // Обновление информации о координатах
    function updateCoordinatesInfo() {
        if (selectedCoordinates) {
            coordinatesInfo.textContent =
                `Широта: ${selectedCoordinates[0].toFixed(6)}, ` +
                `Долгота: ${selectedCoordinates[1].toFixed(6)}`;
        }
    }

    // Обработчик формы
    document.getElementById('petForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!selectedCoordinates) {
            alert('Пожалуйста, выберите местоположение на карте!');
            return;
        }
        const formData = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            type: document.getElementById('type').value,
            status: document.getElementById('status').value,
            photo: await readFile(document.getElementById('photo').files[0]),
            lat: selectedCoordinates[0],
            lon: selectedCoordinates[1]
        };
        allPets.push({ ...formData, id: Date.now() }); // Добавляем новое объявление
        updateContent(); // Обновляем контент
        closeModal(); // Закрываем модальное окно
    });

    // Функция обновления контента
    function updateContent() {
        if (map) {
            updateMap(); // Обновляем карту
        }
        updateTicker(); // Обновляем тикер
    }

    // Обновление карты
    function updateMap() {
        currentPlacemarks.forEach(pm => map.geoObjects.remove(pm)); // Удаляем старые метки
        currentPlacemarks = [];
        // Фильтрация объявлений
        const filteredPets = filterPets();
        // Добавление новых меток
        filteredPets.forEach(pet => {
            const placemark = createPlacemark(pet);
            map.geoObjects.add(placemark);
            currentPlacemarks.push(placemark);
        });
    }

    // Фильтрация объявлений
    function filterPets() {
        const type = document.getElementById('filterType').value;
        const status = document.getElementById('filterStatus').value;
        return allPets.filter(pet => {
            return (type === 'all' || pet.type === type) &&
                   (status === 'all' || pet.status === status);
        });
    }

    // Создание метки на карте
    function createPlacemark(pet) {
        return new ymaps.Placemark([pet.lat, pet.lon], {
            hintContent: pet.title,
            balloonContent: `
                <div class="balloon">
                    <img src="${pet.photo}" alt="${pet.title}" style="width:100px;height:100px;object-fit:cover">
                    <h3>${pet.title}</h3>
                    <p>${pet.description}</p>
                    <p>Статус: ${pet.status === 'lost' ? 'Потерян' : 'Найден'}</p>
                </div>
            `
        }, {
            preset: 'islands#icon',
            iconColor: pet.status === 'lost' ? '#ff4d4d' : '#4CAF50'
        });
    }

    // Обновление тикера
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
            // Взаимодействие с тикером
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

    // Чтение файла изображения
    function readFile(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
        });
    }

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
        },
        {
            id: 3,
            title: "Потерян попугай Кеша",
            description: "Говорящий попугай, красно-зеленый",
            type: "other",
            status: "lost",
            lat: 55.761574,
            lon: 37.583856,
            photo: "https://via.placeholder.com/60x60"
        },
        {
            id: 4,
            title: "Найден котёнок",
            description: "Белый котёнок, без ошейника",
            type: "cat",
            status: "found",
            lat: 55.741574,
            lon: 37.563856,
            photo: "https://placekitten.com/60/60"
        },
        {
            id: 5,
            title: "Потерян щенок",
            description: "Маленький щенок, коричневый",
            type: "dog",
            status: "lost",
            lat: 55.771574,
            lon: 37.593856,
            photo: "https://placedog.net/60/60"
        },
        {
            id: 6,
            title: "Найден хомяк",
            description: "Маленький хомячок, серый",
            type: "other",
            status: "found",
            lat: 55.731574,
            lon: 37.553856,
            photo: "https://via.placeholder.com/60x60"
        }
    ];

    // Добавляем обработчики для фильтров
    document.getElementById('filterType').addEventListener('change', updateContent);
    document.getElementById('filterStatus').addEventListener('change', updateContent);
});