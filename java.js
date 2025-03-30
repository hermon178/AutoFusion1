import { db } from './db.js';
import { query, collection, getDocs, onSnapshot, orderBy } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

// Select DOM elements
const cartCountEl = document.querySelector("#cart-count");
const cartOverlay = document.querySelector("#cart");
const cartItemsEl = document.querySelector("#cart-items");
const checkoutBtn = document.querySelector("#checkout-btn");
const ticketOverlay = document.querySelector("#ticket");
const closeCartBtn = document.querySelector("#close-cart");
const closeTicketBtn = document.querySelector("#close-ticket");
const ticketProductsEl = document.querySelector("#ticket-products");
const ticketTotalEl = document.querySelector("#ticket-total");

// Firebase Authentication for logout
const auth = getAuth();
const logoutBtn = document.getElementById("logoutBtn");

logoutBtn.addEventListener("click", () => {
    signOut(auth).then(() => {
        alert("Du er logget ut!");
        window.location.href = "login.html"; // Redirect to login page
    }).catch((error) => {
        console.error("Logout failed:", error);
    });
});

let cart = [];

// Fetch products from Firestore
async function hentProdukter(sortBy = 'CarName') {
    let q = query(collection(db, "products"));

    if (sortBy === 'Pris') {
        q = query(collection(db, "products"), orderBy("Pris"));
    } else if (sortBy === 'CarName') {
        q = query(collection(db, "products"), orderBy("CarName"));
    }

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
        const produktData = doc.data();
        visProduktElement(produktData);
    });
}

// Real-time update for products
function hentProdukterSanntid(sortBy = 'CarName') {
    let q = query(collection(db, "products"));

    if (sortBy === 'Pris') {
        q = query(collection(db, "products"), orderBy("Pris"));
    } else if (sortBy === 'CarName') {
        q = query(collection(db, "products"), orderBy("CarName"));
    }

    onSnapshot(q, (querySnapshot) => {
        const productList = document.querySelector("#product-list");
        productList.innerHTML = ""; // Clear current list
        querySnapshot.forEach((doc) => {
            const produktData = doc.data();
            visProduktElement(produktData);
        });
    });
}

// Display products
function visProduktElement(produktData) {
    const divEl = document.createElement("div");
    divEl.classList.add("produkt");

    const imgEl = document.createElement("img");
    imgEl.setAttribute("src", produktData.Img.startsWith("http") ? produktData.Img : "src/" + produktData.Img);
    imgEl.classList.add("img");

    const carNameEl = document.createElement("h2");
    carNameEl.textContent = produktData.CarName;

    const carTypeEl = document.createElement("h3");
    carTypeEl.textContent = produktData.CarType;

    const addButton = document.createElement("button");
    addButton.textContent = "Add to Cart";
    addButton.classList.add("button");
    addButton.addEventListener("click", () => leggTilIVogn(produktData));

    divEl.appendChild(imgEl);
    divEl.appendChild(carNameEl);
    divEl.appendChild(carTypeEl);
    divEl.appendChild(addButton);
    document.querySelector("#product-list").appendChild(divEl);
}

// Add product to cart
function leggTilIVogn(produktData) {
    cart.push(produktData);
    oppdaterHandlevogn();
}

// Update the cart count
function oppdaterHandlevogn() {
    cartCountEl.textContent = cart.length;
    if (cart.length > 0) {
        cartCountEl.style.display = "flex";
    } else {
        cartCountEl.style.display = "none";
    }
}

// Show the cart overlay
function visHandlevogn() {
    cartOverlay.style.display = "flex";
    cartItemsEl.innerHTML = "";

    if (cart.length === 0) {
        const emptyCartMessage = document.createElement("p");
        emptyCartMessage.textContent = "Your cart is empty.";
        cartItemsEl.appendChild(emptyCartMessage);
    } else {
        cart.forEach((produkt, index) => {
            const divEl = document.createElement("div");
            divEl.classList.add("product-item");

            const nameSpan = document.createElement("span");
            nameSpan.textContent = produkt.CarName;

            const priceSpan = document.createElement("span");
            priceSpan.textContent = produkt.Pris;

            const removeButton = document.createElement("button");
            removeButton.textContent = "Remove";
            removeButton.classList.add("remove-btn");
            removeButton.addEventListener('click', () => slettProduktFraHandlevogn(index));

            divEl.appendChild(nameSpan);
            divEl.appendChild(priceSpan);
            divEl.appendChild(removeButton);

            cartItemsEl.appendChild(divEl);
        });
    }
}

// Remove product from cart
function slettProduktFraHandlevogn(index) {
    cart.splice(index, 1);
    oppdaterHandlevogn();
    visHandlevogn(); // Update cart view
}

// Checkout process
function checkout() {
    const total = cart.reduce((acc, produkt) => acc + produkt.Pris, 0);
    ticketProductsEl.innerHTML = ""; // Clear previous ticket list
    cart.forEach(produkt => {
        const pEl = document.createElement("p");
        pEl.textContent = produkt.CarName;
        ticketProductsEl.appendChild(pEl);
    });

    ticketTotalEl.textContent = total;

    cart = []; // Clear cart after purchase
    oppdaterHandlevogn();
    cartOverlay.style.display = "none";
    ticketOverlay.style.display = "flex";
}

// Close the cart overlay
closeCartBtn.addEventListener("click", () => {
    cartOverlay.style.display = "none";
});

// Close the ticket overlay
closeTicketBtn.addEventListener("click", () => {
    ticketOverlay.style.display = "none";
});

// Checkout button click
checkoutBtn.addEventListener("click", checkout);

// Show the cart when clicking the cart icon
document.querySelector("#cart-icon").addEventListener("click", visHandlevogn);

// Fetch products on page load
hentProdukterSanntid();

// Sort products by name or price
document.getElementById('sort-by-name').addEventListener('click', () => hentProdukterSanntid('CarName'));
document.getElementById('sort-by-price').addEventListener('click', () => hentProdukterSanntid('Pris'));
