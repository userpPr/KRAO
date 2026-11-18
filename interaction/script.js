const orderList = document.getElementById('order-list'); 
const totalEl = document.getElementById('total'); 
const clearBtn = document.getElementById('clear-order'); 
const placeOrderBtn = document.getElementById('placeAnOrder'); 
const addOrderToTableBtn = document.getElementById('addOrderToTable'); 
const confirmation = document.getElementById('fullscreen-confirmation'); 
const confettiContainer = document.getElementById('confetti-container'); 

const qrModal = document.getElementById('qr-modal'); 
const showQrBtn = document.getElementById('show-qr-btn'); 
const closeQrBtn = document.querySelector('.close-qr'); 

const waModal = document.getElementById('wa-modal'); 
const onlineOrderBtn = document.getElementById('online-order-btn'); 
const closeWaBtn = document.querySelector('.close-wa'); 
const waSendBtn = document.getElementById('wa-send-btn'); 
const waAddressInput = document.getElementById('wa-address'); 
const waPhoneInput = document.getElementById('wa-phone'); 
const waQrContainer = document.getElementById('wa-qr-container'); 
const waQrImg = document.getElementById('wa-qr-img'); 
const waOrderInfo = document.getElementById('wa-order-info'); 
const orderIdDisplay = document.getElementById('order-id-display');

const connectionDot = document.getElementById('connection-dot');
const connectionText = document.getElementById('connection-text');

// --- Сворачивание панели чека вправо и создание вкладки ---
const orderSidebar = document.getElementById('order');
const orderHeader = document.querySelector('.order-header');

orderHeader.style.cursor = 'pointer';
orderHeader.title = 'Нажмите, чтобы свернуть боковую панель чека';

const expandSidebarBtn = document.createElement('div');
expandSidebarBtn.innerHTML = 'ТЕКУЩИЙ ЧЕК ◀';
expandSidebarBtn.style.cssText = `
  position: fixed; 
  right: 0; 
  top: 50%; 
  transform: translateY(-50%);
  background-color: var(--bg-panel);
  color: var(--accent-gold);
  border: 1px solid var(--border-color);
  border-right: none;
  padding: 20px 10px; 
  border-radius: 12px 0 0 12px;
  cursor: pointer; 
  font-size: 14px;
  font-weight: 600; 
  writing-mode: vertical-rl;
  text-orientation: mixed; 
  display: block; 
  z-index: 1000;
  box-shadow: -4px 0 15px rgba(0,0,0,0.3);
  transition: background-color 0.2s, color 0.2s;
`;
expandSidebarBtn.addEventListener('mouseenter', () => expandSidebarBtn.style.backgroundColor = 'var(--bg-card)');
expandSidebarBtn.addEventListener('mouseleave', () => expandSidebarBtn.style.backgroundColor = 'var(--bg-panel)');
document.body.appendChild(expandSidebarBtn);

// Скрываем чек по умолчанию при запуске
orderSidebar.style.display = 'none';

orderHeader.addEventListener('click', () => {
  orderSidebar.style.display = 'none'; 
  expandSidebarBtn.style.display = 'block'; 
});

expandSidebarBtn.addEventListener('click', () => {
  orderSidebar.style.display = 'flex'; // Возвращаем flex, чтобы элементы внутри не ломались
  expandSidebarBtn.style.display = 'none'; 
});


const scriptURL = 'https://script.google.com/macros/s/AKfycbxasBSMGbc1Bn9flQjtllpqDGMEJp8IxY8I8X9s24B5SZUQxJSN-VJDrEOmS7Y4K075hA/exec';

let total = 0; 
const orderItems = []; 
let currentOrderNumber = 1; 

const fallbackMenu = [
  { category: 'Ашкана', name: 'Борщ', price: 250 },
  { category: 'Тез татым', name: 'Бургер (курица)', price: 160 },
  { category: 'Напитки', name: 'Кофе', price: 20 }
];

function renderMenu(menuData) {
  const menuContainer = document.getElementById('menu-container');
  menuContainer.innerHTML = ''; 

  const categories = {};
  menuData.forEach(item => {
    if (!categories[item.category]) categories[item.category] = [];
    categories[item.category].push(item);
  });

  for (const [categoryName, items] of Object.entries(categories)) {
    const catDiv = document.createElement('div');
    catDiv.className = 'category';
    
    const title = document.createElement('h3');
    title.textContent = categoryName;
    
    const itemsWrapper = document.createElement('div');
    itemsWrapper.className = 'items-wrapper';
    
    title.style.cursor = 'pointer';
    title.title = 'Нажмите, чтобы свернуть/развернуть категорию';
    
    itemsWrapper.style.display = 'none';
    title.style.opacity = '0.6'; 
    catDiv.style.gridColumn = '1 / -1'; 
    catDiv.style.maxWidth = '320px';

    title.addEventListener('click', () => {
      if (itemsWrapper.style.display === 'none') {
        itemsWrapper.style.display = '';
        title.style.opacity = '1';
        catDiv.style.gridColumn = ''; 
        catDiv.style.maxWidth = ''; 
      } else {
        itemsWrapper.style.display = 'none';
        title.style.opacity = '0.6'; 
        catDiv.style.gridColumn = '1 / -1'; 
        catDiv.style.maxWidth = '320px'; 
      }
    });
    
    catDiv.appendChild(title);
    catDiv.appendChild(itemsWrapper);

    items.forEach(item => {
      const dishDiv = document.createElement('div');
      dishDiv.className = 'dish';
      dishDiv.innerHTML = `
        <span>${item.name}</span> 
        <div class="dish-action">
          ${item.price} <span class="som-symbol">С</span> 
          <button>+</button>
        </div>
      `;

      const addBtn = dishDiv.querySelector('button');
      addBtn.addEventListener('click', (e) => {
        e.stopPropagation(); 
        addToOrder(item.name, item.price);
      });

      dishDiv.addEventListener('click', function(e) {
        if (e.target.tagName !== 'BUTTON') {
          this.classList.toggle('strike');
          addBtn.disabled = this.classList.contains('strike'); 
        }
      });

      itemsWrapper.appendChild(dishDiv);
    });
    menuContainer.appendChild(catDiv);
  }
}

async function fetchPricesAndSync() {
  connectionDot.style.backgroundColor = '#ffca28'; 
  connectionText.textContent = 'Синхронизация с базой...';

  try {
    const response = await fetch(scriptURL);
    if (!response.ok) throw new Error('Сеть не отвечает');
    
    const data = await response.json();
    if (data.error) throw new Error(data.error);

    renderMenu(data.menu); 
    
    if (data.nextOrderId !== undefined) {
      currentOrderNumber = data.nextOrderId;
      updateOrderHeader(); 
    }

    connectionDot.style.backgroundColor = '#4caf50'; 
    connectionText.textContent = 'Терминал активен';
    
  } catch (error) {
    console.error('Ошибка загрузки данных:', error);
    renderMenu(fallbackMenu); 
    connectionDot.style.backgroundColor = '#f44336'; 
    connectionText.textContent = 'Оффлайн (Резервный режим)';
  }
}
fetchPricesAndSync();


function addToOrder(dishName, price) {
  const existing = orderItems.find(item => item.name === dishName);

  if (existing) {
    existing.quantity++;
    existing.input.value = existing.quantity;
  } else {
    const itemEl = document.createElement('div');
    const text = document.createElement('span');
    text.innerHTML = `${dishName} - ${price} <span class="som-symbol">С</span>`;

    const input = document.createElement('input');
    input.type = 'number';
    input.min = '1';
    input.value = '1';

    const removeBtn = document.createElement('button');
    removeBtn.innerHTML = '×';
    removeBtn.className = 'remove-item-btn';

    itemEl.appendChild(text);
    itemEl.appendChild(input);
    itemEl.appendChild(removeBtn);
    orderList.appendChild(itemEl);

    const newItem = { name: dishName, price, quantity: 1, element: itemEl, input };
    orderItems.push(newItem);

    input.addEventListener('input', () => {
      const qty = parseInt(input.value, 10);
      if (!isNaN(qty) && qty >= 1) { newItem.quantity = qty; updateTotal(); }
    });

    input.addEventListener('change', () => {
      let qty = parseInt(input.value, 10);
      if (isNaN(qty) || qty < 1) { qty = 1; input.value = 1; }
      newItem.quantity = qty;
      updateTotal();
    });

    removeBtn.addEventListener('click', () => {
      orderList.removeChild(itemEl); 
      const index = orderItems.indexOf(newItem);
      if (index > -1) orderItems.splice(index, 1); 
      updateTotal();
    });
  }
  updateTotal();
}

function updateTotal() {
  total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  totalEl.textContent = total; 
}

clearBtn.addEventListener('click', () => {
  orderList.innerHTML = ''; 
  orderItems.length = 0;    
  updateTotal();            
});

function updateOrderHeader() {
  if (!orderIdDisplay) return;
  const now = new Date();
  const dateStr = now.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const formattedNumber = String(currentOrderNumber).padStart(4, '0');
  
  orderIdDisplay.innerHTML = `#${formattedNumber} <span style="font-weight: 400; font-size: 11px; margin-left: 8px; opacity: 0.7; color: var(--text-muted);">${dateStr} ${timeStr}</span>`;
}
setInterval(updateOrderHeader, 60000);


function commitOrderToBackend(noteText, triggerBtn) {
  const formData = new FormData();
  
  const itemsString = orderItems.map(item => `${item.name} (x${item.quantity})`).join("\n");
  
  formData.append("items", itemsString);
  formData.append("total", total);
  if (noteText) formData.append("note", noteText);

  fetch(scriptURL, { method: "POST", mode: "no-cors", body: formData })
    .catch(err => console.error("Ошибка отправки:", err));

  orderItems.length = 0;
  total = 0;
  orderList.innerHTML = '';
  totalEl.textContent = '0';

  currentOrderNumber++;
  updateOrderHeader();

  showSuccessAnimation(triggerBtn);
}

placeOrderBtn.addEventListener("click", () => {
  if (orderItems.length === 0) return alert("Сначала выберите блюда!");
  commitOrderToBackend("", placeOrderBtn); 
});

addOrderToTableBtn.addEventListener("click", () => {
  if (orderItems.length === 0) return alert("Сначала выберите блюда!");
  let validTable = false;
  let note = "";
  
  while (!validTable) {
    const tableInput = prompt("Введите номер столика (от 1 до 20):");
    if (tableInput === null) return; 
    
    const tableNum = parseInt(tableInput, 10);
    if (!isNaN(tableNum) && tableNum >= 1 && tableNum <= 20) {
      note = `Дозаказ для стола № ${tableNum}`;
      validTable = true; 
    } else {
      alert("Ошибка! Введите цифру от 1 до 20.");
    }
  }
  commitOrderToBackend(note, addOrderToTableBtn); 
});

showQrBtn.addEventListener('click', () => qrModal.classList.add('show'));
closeQrBtn.addEventListener('click', () => qrModal.classList.remove('show'));
qrModal.addEventListener('click', (e) => { if (e.target === qrModal) qrModal.classList.remove('show'); });

onlineOrderBtn.addEventListener('click', () => {
  if (orderItems.length === 0) return alert("Сначала выберите блюда!");
  
  waAddressInput.value = 'г. Кара-Балта, ул. '; 
  waPhoneInput.value = '996'; 
  waQrContainer.style.display = 'none'; 
  
  waOrderInfo.innerHTML = `
    <p style="margin:0 0 8px 0; color:var(--text-muted);">Позиций в чеке: <strong>${orderItems.length}</strong></p>
    <p style="margin:0; font-size:16px;">Итого к оплате: <strong style="color:var(--accent-gold); font-size:18px;">${total} С</strong></p>
  `;
  waModal.classList.add('show');
});

closeWaBtn.addEventListener('click', () => waModal.classList.remove('show'));
waModal.addEventListener('click', (e) => { if (e.target === waModal) waModal.classList.remove('show'); });

waSendBtn.addEventListener('click', () => {
  const phone = waPhoneInput.value.trim(); 
  const address = waAddressInput.value.trim(); 
  
  if (!address || address === 'г. Кара-Балта, ул.') return alert("Введите полный адрес!");
  if (!/^996\d{9}$/.test(phone)) return alert("Неверный номер. Формат: 996XXXXXXXXX");

  const formattedNumber = String(currentOrderNumber).padStart(4, '0');
  let waText = `*URI онлайн | Заказ #${formattedNumber}*\n\n`;
  orderItems.forEach(item => { waText += `- ${item.name} (x${item.quantity}) - ${item.price * item.quantity} С\n`; });
  waText += `\n*Итого к оплате: ${total} С*\n\nАдрес доставки: ${address}\n\nОплатите по QR-коду (кассир прикрепит картинку к этому сообщению)`;
  
  const encodedText = encodeURIComponent(waText);
  window.open(`https://wa.me/${phone}?text=${encodedText}`, '_blank');
  
  waQrImg.src = `img/qr-poster.png`;
  waQrContainer.style.display = 'block';

  commitOrderToBackend(`WhatsApp: ${phone}\nАдрес: ${address}`, onlineOrderBtn);
  setTimeout(() => waModal.classList.remove('show'), 4000);
});


document.addEventListener('click', (e) => {
  if (e.target.tagName === 'BUTTON' && !e.target.classList.contains('remove-item-btn') && e.target !== showQrBtn && e.target !== closeQrBtn && e.target !== closeWaBtn) {
    e.target.classList.add('vibrate');
    setTimeout(() => e.target.classList.remove('vibrate'), 300);
  }
});

function randomColor() {
  const colors = ["#d4af37", "#f9a825", "#ffb300", "#ffca28", "#ffe082"];
  return colors[Math.floor(Math.random() * colors.length)];
}

function showSuccessAnimation(triggerButton) {
  const rect = triggerButton.getBoundingClientRect();
  
  for (let i = 0; i < 20; i++) {
    const confetti = document.createElement("div");
    confetti.className = "confetti";
    const angle = Math.random() * 2 * Math.PI; 
    const distance = Math.random() * 60 + 20;  
    confetti.style.setProperty("--x", `${Math.cos(angle) * distance}px`);
    confetti.style.setProperty("--y", `${Math.sin(angle) * distance}px`);
    confetti.style.left = `${rect.left + rect.width / 2}px`;
    confetti.style.top = `${rect.top + rect.height / 2}px`;
    document.body.appendChild(confetti);
    setTimeout(() => confetti.remove(), 600);
  }
  
  confirmation.classList.add("show");
  
  for (let i = 0; i < 30; i++) {
    const confetti = document.createElement("div");
    confetti.classList.add("confetti");
    confetti.style.left = Math.random() * 100 + "vw"; 
    confetti.style.top = Math.random() * 20 + "vh"; 
    confetti.style.backgroundColor = randomColor();
    confettiContainer.appendChild(confetti);
    setTimeout(() => confetti.remove(), 1000);
  }
  
  setTimeout(() => confirmation.classList.remove("show"), 1000);
}

document.getElementById('current-year').textContent = new Date().getFullYear();