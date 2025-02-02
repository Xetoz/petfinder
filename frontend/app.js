document.addEventListener('DOMContentLoaded', () => {
    // Управление модальным окном
    const modal = document.getElementById('addModal');
    const addBtn = document.getElementById('addPetBtn');
    const closeBtn = document.querySelector('.close');

    addBtn.addEventListener('click', () => modal.style.display = 'block');
    closeBtn.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => e.target === modal && (modal.style.display = 'none'));

    // Инициализация карты
    ymaps.ready(initMap);
});

let map;
let selectedCoordinates = null;

function initMap() {
    map = new ymaps.Map('map', {
        center: [55.751574, 37.573856],
        zoom: 12,
        controls: ['zoomControl']
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

    // Загрузка тестовых данных
    loadPets();
}

function loadPets() {
    const testData = [
        {id: 1, lat: 55.751574, lon: 37.573856, title: "Потерян кот Барсик", type: "cat", status: "lost"},
        {id: 2, lat: 55.758163, lon: 37.616488, title: "Найдена собака", type: "dog", status: "found"}
    ];

    testData.forEach(pet => {
        const placemark = new ymaps.Placemark([pet.lat, pet.lon], {
            hintContent: pet.title,
            balloonContent: pet.description || 'Нет описания'
        }, {
            iconLayout: 'default#image',
            iconImageHref: getIcon(pet.type),
            iconImageSize: [40, 40],
            iconImageOffset: [-20, -40]
        });
        map.geoObjects.add(placemark);
    });
}

function getIcon(type) {
    const icons = {
        cat: 'https://img.icons8.com/color/48/cat.png',
        dog: 'https://img.icons8.com/color/48/dog.png',
        other: 'https://img.icons8.com/color/48/pet-commands-summon.png'
    };
    return icons[type] || icons.other;
}

// Обработчик формы
document.getElementById('petForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const petData = {
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        type: document.getElementById('type').value,
        status: document.getElementById('status').value,
        coordinates: selectedCoordinates
    };

    if (!petData.coordinates) {
        alert('Выберите местоположение на карте!');
        return;
    }

    console.log('Отправка данных:', petData);
    alert('Объявление успешно добавлено!');
    document.getElementById('addModal').style.display = 'none';
});