class RoutePlanner {
    constructor() {
        // Привязка контекста для обработчиков
        this.handleFileUpload = this.handleFileUpload.bind(this);
        this.handlePointClick = this.handlePointClick.bind(this);
        this.handleRouteClick = this.handleRouteClick.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);

        // Инициализация состояния
        this.state = {
            isPointMode: false,
            isRouteMode: false,
            currentPointType: null,
            points: [],
            routes: [],
            currentRoute: [],
            tempLine: null,
            crosshair: null,
            uploadedImage: null,
            routeColor: '#ff5722'
        };

        // Цвета для типов точек
        this.pointColors = {
            storage: 'green',
			production: 'orange',
            assembly: 'purple',
			manufacturing: 'blue',
			product: 'red'
			
        };

        this.init();
		this.state.zoom = 1;
    }

    createCrosshair() {
        this.state.crosshair = document.createElement('div');
        this.state.crosshair.className = 'crosshair-cursor';
        this.state.crosshair.style.display = 'none';
        document.body.appendChild(this.state.crosshair);
    }

    init() {
        try {
            this.createCrosshair();
            this.setupEventListeners();
            this.setupSaveHandlers();
            console.log("Приложение инициализировано");
        } catch (error) {
            console.error('Ошибка инициализации:', error);
        }
		// Инициализация SVG viewBox
    this.updateSvgViewBox();
    
    // Обновлять при изменении размеров
    window.addEventListener('resize', () => this.updateSvgViewBox());
}

updateSvgViewBox() {
    const layout = document.getElementById('layout');
    const svg = document.getElementById('routes-svg');
    
    if (layout && svg) {
        const width = layout.clientWidth;
        const height = layout.clientHeight;
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    }
}

   

    setupEventListeners() {
        document.getElementById('add-points-btn').addEventListener('click', (e) => {
            e.preventDefault();
            this.togglePointMode();
        });

        document.getElementById('create-route-btn').addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleRouteMode();
        });

        document.getElementById('upload-btn').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('file-upload').click();
        });

        document.getElementById('file-upload').addEventListener('change', (e) => {
            e.preventDefault();
            this.handleFileUpload(e);
        });

        document.querySelectorAll('.point-type').forEach(point => {
            point.addEventListener('click', (e) => {
                e.preventDefault();
                this.selectPointType(point.dataset.type);
            });
        });

        document.getElementById('layout').addEventListener('click', (e) => {
            e.preventDefault();
            if (this.state.isPointMode) this.handlePointClick(e);
            else if (this.state.isRouteMode) this.handleRouteClick(e);
        });

        document.getElementById('layout').addEventListener('mousemove', (e) => {
            e.preventDefault();
            this.handleMouseMove(e);
        });

        document.getElementById('close-panel-btn').addEventListener('click', (e) => {
            e.preventDefault();
            this.deactivatePointMode();
        });
		document.getElementById('layout').addEventListener('contextmenu', (e) => {
            e.preventDefault();
         if (this.state.isPointMode) {
           this.handleRightClick(e);
            }
        });
		// Вешаем обработчик (колесо мыши)  на элемент с изображением (или его контейнер)
        document.getElementById('layout').addEventListener('wheel', (e) => {
    e.preventDefault(); // Отменяем стандартную прокрутку страницы
    const delta = e.deltaY > 0 ? -0.1 : 0.1; // Направление прокрутки
    this.zoomImage(delta);
});
    // В setupEventListeners():
document.getElementById('zoom-in').addEventListener('click', () => {
    this.zoomImage(0.1);
});
document.getElementById('zoom-out').addEventListener('click', () => {
    this.zoomImage(-0.1);
});
document.getElementById('zoom-reset').addEventListener('click', () => {
    this.state.zoom = 1;
    document.getElementById('layout').querySelector('img').style.transform = 
        'translate(-50%, -50%) scale(1)';
});

}
zoomImage(delta) {
    this.state.zoom = Math.max(0.5, Math.min(2, this.state.zoom + delta));
    const img = document.getElementById('layout').querySelector('img');
    if (img) {
        img.style.transform = `translate(-50%, -50%) scale(${this.state.zoom})`;
    }
}


    setupSaveHandlers() {
        document.getElementById('save-data-btn').addEventListener('click', (e) => {
            e.preventDefault();
            this.saveRoute(false);
        });

        document.getElementById('save-as-btn').addEventListener('click', (e) => {
            e.preventDefault();
            this.saveRoute(true);
        });

        document.getElementById('load-data-btn').addEventListener('click', (e) => {
            e.preventDefault();
            this.loadRoutesList();
        });

        document.getElementById('clear-data-btn').addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm("Очистить все точки и маршруты?")) this.clearAll();
        });
		
    }

    togglePointMode() {
        if (this.state.isRouteMode) this.deactivateRouteMode();
        this.state.isPointMode = !this.state.isPointMode;
        
        if (this.state.isPointMode) {
            document.getElementById('points-panel').classList.remove('hidden');
            document.body.classList.add('point-placement-mode');
            this.state.crosshair.style.display = 'block';
            this.showNotification("Режим добавления точек: выберите тип точки", "info");
        } else {
            this.deactivatePointMode();
        }
    }

    deactivatePointMode() {
        this.state.isPointMode = false;
        this.state.currentPointType = null;
        document.getElementById('points-panel').classList.add('hidden');
        document.body.classList.remove('point-placement-mode');
        this.state.crosshair.style.display = 'none';
        document.querySelectorAll('.point-type').forEach(el => el.classList.remove('selected'));
    }

    toggleRouteMode() {
        if (this.state.isPointMode) this.deactivatePointMode();
        this.state.isRouteMode = !this.state.isRouteMode;
        
        if (this.state.isRouteMode) {
            this.state.currentRoute = [];
            document.body.classList.add('point-placement-mode');
            this.state.crosshair.style.display = 'block';
            this.showNotification("Режим создания маршрута: кликните по первой точке", "info");
        } else {
            this.deactivateRouteMode();
        }
        if (this.state.isRouteMode) {
        document.getElementById('route-name').focus();
    }
}

    deactivateRouteMode() {
        this.state.isRouteMode = false;
        this.state.currentRoute = [];
        document.body.classList.remove('point-placement-mode');
        this.state.crosshair.style.display = 'none';
        this.updateRouteVisualization();
    }

    selectPointType(type) {
        this.state.currentPointType = type;
        document.querySelectorAll('.point-type').forEach(el => {
            el.classList.toggle('selected', el.dataset.type === type);
        });
        this.showNotification(`Выбран тип: ${this.getPointTypeName(type)}`, "info");
    }

    getPointTypeName(type) {
        const names = {
            'storage': 'Склад материалов и комлектующих',
			'production': 'Изготовление заготовок',
            'manufacturing': 'Изготовление деталей',
			'assembly': 'Изготовление сборочных единиц',
			'product': 'Сборка изделия',
            'turn': 'Поворот'
        };
        return names[type] || type;
    }

    handleFileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        const layout = document.getElementById('layout');
        
        reader.onload = (event) => {
            layout.querySelector('.empty-state')?.remove();
            
            let img = layout.querySelector('img');
            if (!img) {
                img = new Image();
                img.onload = () => {
                    img.style.maxWidth = '100%';
                    img.style.maxHeight = '100%';
                    img.style.position = 'absolute';
                    img.style.zIndex = '1';
                };
                layout.appendChild(img);
            }
            
            img.src = event.target.result;
            this.state.uploadedImage = img;
            this.showNotification("Планировка загружена", "success");
        };
        
        reader.readAsDataURL(file);
    }

    handleMouseMove(e) {
        if (!this.state.crosshair) return;
        
        if (this.state.isPointMode || this.state.isRouteMode) {
            this.state.crosshair.style.left = `${e.clientX}px`;
            this.state.crosshair.style.top = `${e.clientY}px`;
            
            if (this.state.isRouteMode && this.state.currentRoute.length > 0) {
                this.updateTempLine(e);
            }
        }
    }

    updateTempLine(e) {
        const layout = document.getElementById('layout');
        const rect = layout.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (this.state.tempLine && this.state.tempLine.parentNode) {
            layout.removeChild(this.state.tempLine);
        }
        
        const lastPoint = this.state.currentRoute[this.state.currentRoute.length - 1];
        this.state.tempLine = this.createLine(lastPoint.x, lastPoint.y, x, y, this.state.routeColor, true);
        layout.appendChild(this.state.tempLine);
    }

    handlePointClick(e) {
        if (!this.state.currentPointType) {
            this.showNotification("Сначала выберите тип точки", "warning");
            return;
        }
        
        if (!this.state.uploadedImage) {
            this.showNotification("Сначала загрузите планировку", "warning");
            return;
        }
        
        const layout = document.getElementById('layout');
        const rect = layout.getBoundingClientRect();
        const x = e.clientX - rect.left - window.scrollX;
        const y = e.clientY - rect.top - window.scrollY;

        
        this.addPoint(x, y);
     {
  if (!this.state.currentPointType) {
    this.showNotification("Сначала выберите тип точки", "warning");
    return;
  }

  const layout = document.getElementById('layout');
  const rect = layout.getBoundingClientRect();
  
  // Проверяем, что клик был внутри контейнера
  if (
    e.clientX < rect.left || 
    e.clientX > rect.right || 
    e.clientY < rect.top || 
    e.clientY > rect.bottom
  ) {
    return; // Игнорируем клики вне контейнера
  }

  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  this.addPoint(x, y);
}}
	

    handleRouteClick(e) {
        const layout = document.getElementById('layout');
        const rect = layout.getBoundingClientRect();
        const x = e.clientX - rect.left - window.scrollX;
        const y = e.clientY - rect.top - window.scrollY;
        
        const clickedPoint = this.findPointAtPosition(x, y);
        
        if (clickedPoint) {

            if (this.state.currentRoute.length === 0) {
                this.state.currentRoute.push({
                    ...clickedPoint,
                    isTurnPoint: false
                });
                this.state.routeColor = this.pointColors[clickedPoint.type] || '#ff5722';
                this.showNotification("Начало маршрута. Кликните следующую точку или место поворота", "info");
            } else {
                this.addIntermediatePoints(x, y);
                this.state.currentRoute.push({
                    ...clickedPoint,
                    isTurnPoint: false
                });
                this.completeRoute();
            }
        } else if (this.state.currentRoute.length > 0) {
            this.addIntermediatePoints(x, y);
            this.state.currentRoute.push({
                x: x,
                y: y,
                type: 'turn',
                id: `turn-${Date.now()}`,
                isTurnPoint: true
            });
            this.updateRouteVisualization();
            this.showNotification("Точка поворота добавлена. Кликните следующую точку", "info");
        }
    }

    addIntermediatePoints(x, y) {
        if (this.state.currentRoute.length === 0) return;
        
        const lastPoint = this.state.currentRoute[this.state.currentRoute.length - 1];
        const dx = x - lastPoint.x;
        const dy = y - lastPoint.y;
        const steps = 5;
        
        for (let i = 1; i <= steps; i++) {
            const ratio = i / steps;
            this.state.currentRoute.push({
                x: lastPoint.x + dx * ratio,
                y: lastPoint.y + dy * ratio,
                type: 'intermediate',
                id: `inter-${Date.now()}-${i}`,
                isTurnPoint: false
            });
        }
    }

    completeRoute() {
        const finalRoute = this.state.currentRoute.filter(
            point => point.type !== 'intermediate'
        );
        
        if (finalRoute.filter(p => !p.isTurnPoint).length >= 2) {
            this.state.routes.push({
                points: [...finalRoute],
                color: this.state.routeColor
            });
            this.showNotification("Маршрут создан", "success");
        } else {
            this.showNotification("Маршрут должен соединять минимум 2 основные точки", "warning");
        }
        
        this.deactivateRouteMode();
    }
	// Удаление точек
		handleRightClick(e) {
  const layout = document.getElementById('layout');
  const rect = layout.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // Ищем точку под курсором
  const pointToRemove = this.findPointAtPosition(x, y);
  
  if (pointToRemove) {
    if (confirm(`Удалить точку ${this.getPointTypeName(pointToRemove.type)}?`)) {
      this.removePoint(pointToRemove.id);
    }
  }
}
removePoint(pointId) {
  // Удаляем из массива точек
  this.state.points = this.state.points.filter(p => p.id !== pointId);
  
  // Удаляем визуальный элемент
  const pointElement = document.querySelector(`.point[data-id="${pointId}"]`);
  if (pointElement) {
    pointElement.remove();
  }
  
  // Обновляем маршруты, если они ссылаются на эту точку
  this.updateRoutesAfterPointRemoval(pointId);
  this.showNotification("Точка удалена", "success");
}

   addPoint(x, y) {
    const point = {
        x: x,  // Уже корректные координаты относительно layout
        y: y,
        type: this.state.currentPointType,
        id: Date.now().toString()
    };
    this.state.points.push(point);
    this.renderPoint(point);
}

    renderPoint(point) {
    const pointElement = document.createElement('div');
    pointElement.className = 'point';
    
    // Координаты должны совпадать с линиями
    pointElement.style.left = `${point.x}px`;
    pointElement.style.top = `${point.y}px`;
    
    pointElement.dataset.id = point.id;
    pointElement.style.backgroundColor = this.pointColors[point.type] || 'gray';
    
    document.getElementById('layout').appendChild(pointElement);
console.log(`Точка: ${point.x},${point.y}`);
}




    

    findPointAtPosition(x, y) {
        return this.state.points.find(point => {
            const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2));
            return distance < 20;
        });
    }


createLine(x1, y1, x2, y2, color, isTemp = false) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    
    // Используем координаты как есть (уже относительные)
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    
    line.setAttribute("stroke", color);
    line.setAttribute("stroke-width", "3");

    
    if (isTemp) {
        line.setAttribute("stroke-dasharray", "5,5");
        line.setAttribute("opacity", "0.7");
    }
    
    return line;
	
}

    updateRouteVisualization() {
        const svg = document.getElementById('routes-svg');
        svg.innerHTML = '';
        
        this.state.routes.forEach(route => {
            this.drawRoute(route.points, route.color, false);
        });
        
        if (this.state.currentRoute.length > 1) {
            this.drawRoute(this.state.currentRoute, this.state.routeColor, true);
        }
    }

    drawRoute(points, color, isTemporary) {
        const svg = document.getElementById('routes-svg');
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        
        let pathData = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            pathData += ` L ${points[i].x} ${points[i].y}`;
        }
        
        path.setAttribute("d", pathData);
        path.setAttribute("stroke", color);
        path.setAttribute("stroke-width", "3");
        path.setAttribute("fill", "none");
        
        if (isTemporary) {
            path.setAttribute("stroke-dasharray", "5,5");
            path.setAttribute("opacity", "0.7");
        }
        
        svg.appendChild(path);
    }

    showNotification(message, type = "info") {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    clearAll(showNotification = true) {
        this.state.points = [];
        this.state.routes = [];
        this.state.currentRoute = [];
        
        document.getElementById('layout').querySelectorAll('.point').forEach(el => el.remove());
        document.getElementById('routes-svg').innerHTML = '';
        
        if (showNotification) {
            this.showNotification("Все данные очищены", "success");
        }
    }

async saveRoute(saveAs = false) {
    // Проверка наличия маршрутов
    if (this.state.routes.length === 0) {
        this.showNotification("Нет маршрутов для сохранения", "warning");
        return;
    }

    // Получаем и проверяем название
    const nameInput = document.getElementById('route-name');
    let routeName = nameInput.value.trim();

    // Блокируем сохранение если поле пустое
    if (!routeName) {
        this.showNotification("Введите наименование изделия перед сохранением", "error");
        nameInput.style.border = "2px solid red";
        nameInput.focus();
        
        setTimeout(() => {
            nameInput.style.border = "";
        }, 2000);
        return;
	const isNameUnique = await this.checkRouteNameUnique(routeName);
    if (!isNameUnique) {
    this.showNotification("Маршрут с таким именем уже существует", "error");
    return;
}

    }

    // Если режим "Сохранить как" - запрашиваем подтверждение имени
    if (saveAs) {
        const newName = prompt("Введите новое имя для маршрута:", routeName);
        if (!newName || newName.trim() === "") return;
        routeName = newName.trim();
    }

    try {
        // Подготовка данных для отправки
        const dataToSave = {
            name: routeName,
            routes: this.state.routes,
            points: this.state.points,
            image: this.state.uploadedImage?.src || null,
            timestamp: new Date().toISOString()
        };

        // Отправка на сервер
        const response = await fetch('/save_route', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(dataToSave)
        });

        if (response.ok) {
            this.showNotification(`Маршрут "${routeName}" успешно сохранен`, "success");
            return await response.json();
        } else {
            throw new Error(await response.text());
        }
    } catch (error) {
        console.error('Ошибка сохранения:', error);
        this.showNotification("Ошибка при сохранении маршрута", "error");
        throw error;
    }


        const routeData = {
            name: routeName,
            routes: this.state.routes,
            points: this.state.points,
            image: this.state.uploadedImage?.src || null,
            timestamp: new Date().toISOString()
        };

        try {
            const response = await fetch('/save_route', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(routeData)
            });

            const result = await response.json();
            
            if (response.ok) {
                this.showNotification(`Маршрут "${routeName}" сохранен`, "success");
            } else {
                throw new Error(result.error || 'Ошибка сервера');
            }
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            this.showNotification("Ошибка при сохранении маршрута", "error");
        }
    }

  async loadRoutesList() {
    try {
        this.showNotification("Получаем список маршрутов...", "info");
        
        const response = await fetch('/get_saved_routes');
        if (!response.ok) throw new Error(`Ошибка сервера: ${response.status}`);
        
        const routes = await response.json();
        if (!routes?.length) {
            this.showNotification("Нет сохраненных маршрутов", "info");
            return;
        }

        const selectedRoute = await this.showRouteSelectionDialog(routes);
        if (selectedRoute) {
            await this.loadRoute(selectedRoute);
        }
    } catch (error) {
        console.error('Ошибка:', error);
        this.showNotification(error.message || "Ошибка загрузки списка", "error");
    }
}

async showRouteSelectionDialog(routes) {
    return new Promise((resolve) => {
        const dialog = document.createElement('div');
        dialog.innerHTML = `
            <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:20px;border-radius:8px;box-shadow:0 0 10px rgba(0,0,0,0.2);z-index:10000;">
                <h3>Выберите маршрут</h3>
                <select id="route-select" style="padding:8px;width:100%;margin:10px 0;">
                    ${routes.map(r => `<option value="${r.name}">${r.name}</option>`).join('')}
                </select>
                <div style="display:flex;justify-content:space-between;">
                    <button id="confirm-load" style="padding:8px 16px;background:#4CAF50;color:white;border:none;border-radius:4px;">Загрузить</button>
                    <button id="cancel-load" style="padding:8px 16px;background:#f44336;color:white;border:none;border-radius:4px;">Отмена</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        document.getElementById('confirm-load').onclick = () => {
            const select = document.getElementById('route-select');
            resolve(select.value);
            dialog.remove();
        };
        
        document.getElementById('cancel-load').onclick = () => {
            resolve(null);
            dialog.remove();
        };
    });
}
  async loadRoute(routeName) {
    try {
        if (!routeName) throw new Error("Не указано имя маршрута");
        
        this.showNotification(`Загрузка "${routeName}"...`, "info");
        
        // Кодируем имя маршрута для URL
        const encodedName = encodeURIComponent(routeName);
        const response = await fetch(`/load_route?name=${encodedName}`);
        
        if (response.status === 404) {
            throw new Error(`Маршрут "${routeName}" не найден на сервере`);
        }
        
        if (!response.ok) {
            throw new Error(`Ошибка сервера: ${response.status}`);
        }
        
        const data = await response.json();
        if (!data) throw new Error("Нет данных маршрута");
        
        // Восстановление состояния
        this.clearAll(false);
        this.state.points = data.points || [];
        this.state.routes = data.routes || [];
        
        // Загрузка изображения если есть
        if (data.image) {
            try {
                await this.loadImage(data.image);
            } catch (imgError) {
                console.warn("Не удалось загрузить изображение:", imgError);
            }
        }
        
        // Восстановление имени
        document.getElementById('route-name').value = data.name || routeName;
        
        this.showNotification(`Маршрут "${routeName}" загружен`, "success");
        return true;
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        this.showNotification(error.message, "error");
        return false;
    }
	
}
   async loadImage(imageSrc) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        
        img.onload = () => {
            try {
                const layout = document.getElementById('layout');
                if (!layout) {
                    throw new Error('Элемент #layout не найден');
                }
                
                // Удаляем старое изображение
                const oldImg = layout.querySelector('img');
                if (oldImg) oldImg.remove();
                
                // Настраиваем новое изображение
                img.style.maxWidth = '100%';
                img.style.maxHeight = '100%';
                img.style.position = 'absolute';
                img.style.zIndex = '1';
                
                layout.appendChild(img);
                this.state.uploadedImage = img;
                resolve();
            } catch (error) {
                reject(error);
            }
        };
        
        img.onerror = () => {
            reject(new Error(`Не удалось загрузить изображение: ${imageSrc}`));
        };
        
        img.src = imageSrc;
    });
}
}
// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    try {
        if (typeof RoutePlanner === 'function') {
            const planner = new RoutePlanner();
            window.planner = planner; // Для отладки
        } else {
            throw new Error('Класс RoutePlanner не определен');
        }
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        alert('Произошла ошибка при загрузке приложения. Пожалуйста, обновите страницу.');
    }
});