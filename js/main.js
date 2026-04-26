// ============================================================
// FILE: js/main.js
// PROJECT: Kusina ni Lola
// DESCRIPTION: Handles all frontend logic:
//   - Dark/light mode toggle (saves to localStorage)
//   - Mobile navigation toggle
//   - Fetches menu from PHP API
//   - Submits reservation and contact forms via Fetch API
// ============================================================

// ── Wait for the HTML to fully load before running any JS ───
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initNavToggle();
  initNavScroll();
  loadMenu();
  setMinReservationDate();
});

// ============================================================
// SECTION 1: DARK / LIGHT MODE
// ── How it works:
//    1. On page load, check localStorage for saved preference
//    2. If none saved, check the user's OS preference
//    3. Toggle button adds/removes .light-mode on <body>
//    4. Save choice to localStorage so it persists next visit
// ============================================================
function initTheme() {
  const toggleBtn = document.getElementById("themeToggle");
  const body = document.body;

  // ── Load saved preference or fall back to OS preference ──
  const saved = localStorage.getItem("theme"); // 'light' | 'dark' | null
  const osDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = saved ? saved === "dark" : osDark;

  // Apply on page load (before user clicks anything)
  if (!isDark) body.classList.add("light-mode");

  // ── Toggle on button click ────────────────────────────────
  toggleBtn.addEventListener("click", () => {
    const isCurrentlyLight = body.classList.toggle("light-mode");
    // Save preference: if light-mode class is now ON, theme = 'light'
    localStorage.setItem("theme", isCurrentlyLight ? "light" : "dark");
  });
}

// ============================================================
// SECTION 2: MOBILE NAVIGATION TOGGLE
// ── Hamburger button shows/hides the nav links on mobile
// ============================================================
function initNavToggle() {
  const toggleBtn = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");

  toggleBtn.addEventListener("click", () => {
    navLinks.classList.toggle("open");
  });

  // Close nav when any link is clicked (smooth UX on mobile)
  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => navLinks.classList.remove("open"));
  });
}

// ============================================================
// SECTION 3: NAVBAR SCROLL EFFECT
// ── Adds a shadow to navbar when user scrolls down
// ============================================================
function initNavScroll() {
  const navbar = document.getElementById("navbar");
  window.addEventListener("scroll", () => {
    // Add class when scrolled more than 50px
    navbar.classList.toggle("scrolled", window.scrollY > 50);
  });
}

// ============================================================
// SECTION 4: LOAD MENU FROM API
// ── Fetches menu items from api/v1/menu.php
//    Builds filter buttons and menu cards dynamically
// ============================================================
async function loadMenu(category = "all") {
  const grid = document.getElementById("menuGrid");
  const filters = document.getElementById("menuFilters");

  // Show loading spinner while fetching
  grid.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Loading menu...</p>
    </div>`;

  try {
    // Build the API URL — add ?category= filter if not 'all'
    const url =
      category === "all"
        ? "api/v1/menu.php"
        : `api/v1/menu.php?category=${encodeURIComponent(category)}`;

    // Fetch data from our PHP API
    const res = await fetch(url);
    const json = await res.json();

    // If API returned an error
    if (!json.success) throw new Error(json.message);

    const items = json.data;

    // ── Build category filter buttons (only on first load) ──
    //    if (category === "all" && filters.children.length === 1) {
    //      // Get unique categories from the data
    //      const categories = [...new Set(items.map((i) => i.category))];
    //
    //      categories.forEach((cat) => {
    //        const btn = document.createElement("button");
    //        btn.className = "filter-btn";
    //        btn.dataset.category = cat;
    //        // Capitalize first letter for display
    //        btn.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
    //        btn.addEventListener("click", () => {
    //          // Remove active from all buttons
    //          document
    //            .querySelectorAll(".filter-btn")
    //            .forEach((b) => b.classList.remove("active"));
    //          btn.classList.add("active");
    //          loadMenu(cat); // reload with filter
    //        });
    //        filters.appendChild(btn);
    //      });
    //    }

    // ── Build category filter buttons (only on first load) ──────
    if (category === "all" && filters.children.length === 1) {
      // Add click listener to the existing "All" button in HTML
      const allBtn = filters.querySelector('[data-category="all"]');
      allBtn.addEventListener("click", () => {
        document
          .querySelectorAll(".filter-btn")
          .forEach((b) => b.classList.remove("active"));
        allBtn.classList.add("active");
        loadMenu("all");
      });

      // Get unique categories from API data
      const categories = [...new Set(items.map((i) => i.category))];

      // Create a button for each category
      categories.forEach((cat) => {
        const btn = document.createElement("button");
        btn.className = "filter-btn";
        btn.dataset.category = cat;
        btn.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);

        btn.addEventListener("click", () => {
          document
            .querySelectorAll(".filter-btn")
            .forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          loadMenu(cat);
        });

        filters.appendChild(btn);
      });
    }

    // ── Build menu cards ─────────────────────────────────────
    if (items.length === 0) {
      grid.innerHTML = `<p class="loading-state">No items found in this category.</p>`;
      return;
    }

    // Clear grid and add cards
    grid.innerHTML = "";
    items.forEach((item, i) => {
      const card = document.createElement("div");
      card.className = "menu-card";
      // Stagger animation delay so cards appear one by one
      card.style.animationDelay = `${i * 0.06}s`;

      // textContent is used for user data to prevent XSS
      // We build structure with createElement for safety
      card.innerHTML = `
        <div class="menu-card-header">
          <span class="menu-card-name"></span>
          <span class="menu-card-price"></span>
        </div>
        <p class="menu-card-desc"></p>
        <span class="menu-card-category"></span>
      `;

      // Use textContent (not innerHTML) for data from database — prevents XSS
      card.querySelector(".menu-card-name").textContent = item.name;
      card.querySelector(".menu-card-price").textContent =
        `₱${item.price.toFixed(2)}`;
      card.querySelector(".menu-card-desc").textContent = item.description;
      card.querySelector(".menu-card-category").textContent = item.category;

      grid.appendChild(card);
    });
  } catch (err) {
    // Show friendly error message if API call fails
    grid.innerHTML = `
      <div class="loading-state">
        <p>⚠️ Could not load menu. Please refresh the page.</p>
      </div>`;
    console.error("Menu load error:", err);
  }
}

// ============================================================
// SECTION 5: RESERVATION FORM SUBMISSION
// ── Collects form values, validates client-side,
//    then POSTs JSON to api/v1/reservations.php
// ============================================================
async function submitReservation() {
  // Clear any previous error messages
  clearErrors([
    "res-name",
    "res-email",
    "res-phone",
    "res-party",
    "res-date",
    "res-time",
  ]);

  // ── Collect form values ───────────────────────────────────
  const data = {
    full_name: document.getElementById("res-name").value.trim(),
    email: document.getElementById("res-email").value.trim(),
    phone:
      document.getElementById("res-phone-code").value +
      document.getElementById("res-phone").value.trim(),
    party_size: document.getElementById("res-party").value,
    date: document.getElementById("res-date").value,
    time: document.getElementById("res-time").value,
    notes: document.getElementById("res-notes").value.trim(),
  };

  // ── Client-side validation (fast feedback before API call) ─
  let hasError = false;

  if (!data.full_name) {
    showError("res-name", "Full name is required.");
    hasError = true;
  }
  if (!data.email || !isValidEmail(data.email)) {
    showError("res-email", "Enter a valid email address.");
    hasError = true;
  }
  if (!data.phone) {
    showError("res-phone", "Phone number is required.");
    hasError = true;
  }
  if (!data.party_size) {
    showError("res-party", "Please select a party size.");
    hasError = true;
  }
  if (!data.date) {
    showError("res-date", "Please select a date.");
    hasError = true;
  }
  if (!data.time) {
    showError("res-time", "Please select a time.");
    hasError = true;
  }

  // Stop here if client-side validation failed
  if (hasError) return;

  // ── Submit to API ─────────────────────────────────────────
  const btn = document.getElementById("resSubmitBtn");
  btn.textContent = "Sending...";
  btn.disabled = true;

  try {
    const res = await fetch("/api/v1/reservations.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();

    if (json.success) {
      showFormMessage("resMessage", json.message, "success");
      clearFormFields([
        "res-name",
        "res-email",
        "res-phone",
        "res-party",
        "res-date",
        "res-time",
        "res-notes",
      ]);
    } else {
      // Show server-side validation errors if any
      const errText = json.errors ? json.errors.join(" ") : json.message;
      showFormMessage("resMessage", errText, "error");
    }
  } catch (err) {
    showFormMessage("resMessage", "Network error. Please try again.", "error");
    console.error("Reservation error:", err);
  } finally {
    // Always re-enable button after request finishes
    btn.textContent = "Confirm Reservation";
    btn.disabled = false;
  }
}

// ============================================================
// SECTION 6: CONTACT FORM SUBMISSION
// ============================================================
async function submitContact() {
  clearErrors(["con-name", "con-email", "con-subject", "con-message"]);

  const data = {
    full_name: document.getElementById("con-name").value.trim(),
    email: document.getElementById("con-email").value.trim(),
    subject: document.getElementById("con-subject").value.trim(),
    message: document.getElementById("con-message").value.trim(),
  };

  let hasError = false;

  if (!data.full_name) {
    showError("con-name", "Full name is required.");
    hasError = true;
  }
  if (!data.email || !isValidEmail(data.email)) {
    showError("con-email", "Enter a valid email address.");
    hasError = true;
  }
  if (!data.subject) {
    showError("con-subject", "Subject is required.");
    hasError = true;
  }
  if (!data.message || data.message.length < 10) {
    showError("con-message", "Message must be at least 10 characters.");
    hasError = true;
  }

  if (hasError) return;

  const btn = document.getElementById("conSubmitBtn");
  btn.textContent = "Sending...";
  btn.disabled = true;

  try {
    const res = await fetch("api/v1/contact.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();

    if (json.success) {
      showFormMessage("conMessage", json.message, "success");
      clearFormFields(["con-name", "con-email", "con-subject", "con-message"]);
    } else {
      const errText = json.errors ? json.errors.join(" ") : json.message;
      showFormMessage("conMessage", errText, "error");
    }
  } catch (err) {
    showFormMessage("conMessage", "Network error. Please try again.", "error");
    console.error("Contact error:", err);
  } finally {
    btn.textContent = "Send Message";
    btn.disabled = false;
  }
}

// ============================================================
// SECTION 7: UTILITY FUNCTIONS
// ── Small helper functions used throughout this file
// ============================================================

// ── Email format validator ───────────────────────────────────
function isValidEmail(email) {
  // Basic regex — checks for something@something.something
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ── Show inline field error ──────────────────────────────────
function showError(fieldId, message) {
  const el = document.getElementById("err-" + fieldId);
  if (el) el.textContent = message;
}

// ── Clear all inline field errors ───────────────────────────
function clearErrors(fieldIds) {
  fieldIds.forEach((id) => {
    const el = document.getElementById("err-" + id);
    if (el) el.textContent = "";
  });
}

// ── Show form success or error banner ───────────────────────
function showFormMessage(elId, message, type) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = message;
  el.className = `form-message ${type}`; // 'success' or 'error'

  // Auto-hide after 6 seconds
  setTimeout(() => {
    el.className = "form-message";
    el.textContent = "";
  }, 6000);
}

// ── Clear form input fields after successful submit ──────────
function clearFormFields(fieldIds) {
  fieldIds.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
}

// ── Set minimum date on reservation calendar ─────────────────
// Prevents users from booking a date in the past
function setMinReservationDate() {
  const dateInput = document.getElementById("res-date");
  if (!dateInput) return;
  // Format today as YYYY-MM-DD (required by date input)
  const today = new Date().toISOString().split("T")[0];
  dateInput.min = today;
}
