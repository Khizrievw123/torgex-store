let cart = JSON.parse(localStorage.getItem("torgexCart") || "[]");

function money(value){
  return value.toLocaleString("ru-RU") + " ₽";
}

function renderProducts(){
  const container = document.getElementById("products");

  const search = document.getElementById("search").value.toLowerCase();
  const category = document.getElementById("categoryFilter").value;
  const stock = document.getElementById("stockFilter").value;
  const sort = document.getElementById("sortFilter").value;

  let list = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search) || p.category.toLowerCase().includes(search);
    const matchesCategory = category === "Все" || p.category === category;
    const matchesStock = stock === "Все" || (stock === "В наличии" && p.stock) || (stock === "Нет" && !p.stock);
    return matchesSearch && matchesCategory && matchesStock;
  });

  if(sort === "low"){
    list.sort((a,b) => a.price - b.price);
  }
  if(sort === "high"){
    list.sort((a,b) => b.price - a.price);
  }
  if(sort === "popular"){
    list.sort((a,b) => Number(b.popular) - Number(a.popular));
  }

  if(!list.length){
    container.innerHTML = `<div class="empty">Ничего не найдено 😔</div>`;
    return;
  }

  container.innerHTML = list.map(p => `
    <article class="product">
      <div class="product-image" onclick="openProduct(${p.id})">
        <img src="${p.image}" alt="${p.name}" loading="lazy">
        <div class="stock ${p.stock ? "ok":"no"}">
          ${p.stock ? "● В наличии":"● Нет в наличии"}
        </div>
      </div>
      <div class="product-info">
        <div class="product-category">${p.category}</div>
        <h3>${p.name}</h3>
        <div class="characteristics">${p.specs}</div>
        <div class="product-bottom">
          <div class="price">${money(p.price)}</div>
          <button class="add" onclick="addToCart(${p.id})" ${!p.stock ? "disabled":""}>
            ${p.stock ? "В корзину":"Нет"}
          </button>
        </div>
      </div>
    </article>
  `).join("");
}

function filterCategory(category){
  document.getElementById("categoryFilter").value = category;
  document.getElementById("catalog").scrollIntoView({behavior:"smooth"});
  renderProducts();
}

function addToCart(id){
  const product = products.find(p => p.id === id);
  if(!product || !product.stock) return;

  const existing = cart.find(item => item.id === id);
  if(existing){
    existing.qty++;
  }else{
    cart.push({ id:id, qty:1 });
  }
  saveCart();
}

function removeFromCart(id){
  cart = cart.filter(item => item.id !== id);
  saveCart();
}

function changeQty(id,change){
  const item = cart.find(i => i.id === id);
  if(!item) return;
  item.qty += change;
  if(item.qty <= 0){
    removeFromCart(id);
    return;
  }
  saveCart();
}

function saveCart(){
  localStorage.setItem("torgexCart", JSON.stringify(cart));
  renderCart();
}

function renderCart(){
  const container = document.getElementById("cartItems");
  const count = cart.reduce((sum,item) => sum + item.qty, 0);
  document.getElementById("cartCount").textContent = count;

  if(!cart.length){
    container.innerHTML = `<div class="empty">Корзина пока пустая 🛒</div>`;
    document.getElementById("cartTotal").textContent = "0 ₽";
    updateWhatsApp();
    return;
  }

  let total = 0;

  container.innerHTML = cart.map(item => {
    const product = products.find(p => p.id === item.id);
    if(!product) return "";
    total += product.price * item.qty;
    return `
      <div class="cart-item">
        <img src="${product.image}">
        <div class="cart-item-info">
          <h4>${product.name}</h4>
          <p>${money(product.price)} × ${item.qty}</p>
          <div class="qty">
            <button onclick="changeQty(${item.id},-1)">−</button>
            <span>${item.qty}</span>
            <button onclick="changeQty(${item.id},1)">+</button>
          </div>
          <button class="remove" onclick="removeFromCart(${item.id})">Удалить</button>
        </div>
      </div>
    `;
  }).join("");

  document.getElementById("cartTotal").textContent = money(total);
  updateWhatsApp();
}

function updateWhatsApp(){
  const link = document.getElementById("whatsappOrder");
  if(!cart.length){
    link.href = "#";
    return;
  }

  let text = "Здравствуйте! Хочу оформить заказ в TORGEX:%0A%0A";
  let total = 0;

  cart.forEach(item => {
    const p = products.find(x => x.id === item.id);
    if(!p) return;
    const sum = p.price * item.qty;
    total += sum;
    text += `• ${p.name} — ${item.qty} шт. — ${money(sum)}%0A`;
  });

  const delivery = document.querySelector('input[name="delivery"]:checked')?.value || "Самовывоз";
  text += `%0AСпособ получения: ${delivery}`;
  text += `%0AИтого: ${money(total)}`;
  link.href = "https://wa.me/79388075656?text=" + text;
}

function openCart(){
  document.getElementById("cart").classList.add("active");
  document.getElementById("overlay").classList.add("active");
  renderCart();
}

function closeCart(){
  document.getElementById("cart").classList.remove("active");
  document.getElementById("overlay").classList.remove("active");
}

function openProduct(id){
  const p = products.find(x => x.id === id);
  if(!p) return;

  document.getElementById("modalImg").src = p.image;
  document.getElementById("modalCategory").textContent = p.category;
  document.getElementById("modalTitle").textContent = p.name;
  document.getElementById("modalPrice").textContent = money(p.price);
  document.getElementById("modalSpecs").innerHTML = `<strong>Характеристики</strong><br>${p.specs}<br><br><strong>Наличие:</strong> ${p.stock ? "В наличии":"Нет в наличии"}`;

  const addButton = document.getElementById("modalAdd");
  addButton.disabled = !p.stock;
  addButton.textContent = p.stock ? "Добавить в корзину":"Нет в наличии";
  addButton.onclick = () => {
    addToCart(p.id);
    closeModal();
  };

  document.getElementById("modal").classList.add("active");
}

function closeModal(){
  document.getElementById("modal").classList.remove("active");
}

document.querySelectorAll('input[name="delivery"]').forEach(input => {
  input.addEventListener("change", updateWhatsApp);
});

renderProducts();
renderCart();