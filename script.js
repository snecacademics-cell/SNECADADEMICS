// 🌟 നിങ്ങളുടെ പുതിയ സ്വതന്ത്ര Apps Script Deploy ചെയ്ത ശേഷം കിട്ടിയ Web App URL ഇവിടെ നൽകുക
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbzFWP1fMyUK-EVAz-0EmvVdaj4iBxOeBbAPRVyxBKy8Il4L363znsWxg9OZhMYEc1nq/exec";

let loggedAffNo = ""; let carouselIndex = 0; let carouselTimer = null; let allLinksData = null; let temporaryPasswordHolder = ""; 
let userFullNameStr = ""; let userFullRole = ""; let userCollegeStr = ""; let userStreamStr = "";

// Universal GAS API Fetcher replacing google.script.run
function callGAS(action, payload, successCallback, failureCallback) {
  const reqData = Object.assign({ action: action }, payload);
  fetch(GAS_API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(reqData)
  })
  .then(res => res.json())
  .then(data => { if (successCallback) successCallback(data); })
  .catch(err => { if (failureCallback) failureCallback(err); else console.error("GAS API Error:", err); });
}

document.addEventListener("DOMContentLoaded", function() {
  initLayoutMode();

  let authTimeout = setTimeout(function() { 
    checkLocalStorageAuthEngine(); 
  }, 1000); 

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const paramU = urlParams.get('u');
    const paramT = urlParams.get('t');

    if (paramU && paramT) {
      var p = decodeFromHex(paramT); 
      if (p) { 
        temporaryPasswordHolder = p; 
        callGAS("checkLogin", { username: paramU, password: p }, function(res) { 
          clearTimeout(authTimeout);
          if(res && res.success) showDashboard(res); else showLoginPageImmediate(); 
        }, showLoginPageImmediate); 
        return; 
      }
    }
    checkLocalStorageAuthEngine();
  } catch(err) { clearTimeout(authTimeout); checkLocalStorageAuthEngine(); }

  // Drag Control setup
  const dragBtn = document.getElementById("fs-toggle-btn");
  if (!dragBtn) return;

  let isDragging = false, hasMoved = false;
  let startX, startY, initialLeft, initialTop;

  dragBtn.addEventListener("mousedown", dragStart);
  document.addEventListener("mousemove", dragMove);
  document.addEventListener("mouseup", dragEnd);

  dragBtn.addEventListener("touchstart", function(e) {
    hasMoved = false; isDragging = true;
    startX = e.touches[0].clientX; startY = e.touches[0].clientY;
    const rect = dragBtn.getBoundingClientRect();
    initialLeft = rect.left; initialTop = rect.top;
  }, { passive: true });

  document.addEventListener("touchmove", function(e) {
    if (!isDragging) return;
    const deltaX = e.touches[0].clientX - startX;
    const deltaY = e.touches[0].clientY - startY;
    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) hasMoved = true;

    let newLeft = initialLeft + deltaX;
    let newTop = initialTop + deltaY;
    const padding = 10;
    const maxLeft = window.innerWidth - dragBtn.offsetWidth - padding;
    const maxTop = window.innerHeight - dragBtn.offsetHeight - padding;

    newLeft = Math.max(padding, Math.min(newLeft, maxLeft));
    newTop = Math.max(padding, Math.min(newTop, maxTop));
    dragBtn.style.left = newLeft + "px";
    dragBtn.style.top = newTop + "px";
    dragBtn.style.right = "auto";
  }, { passive: true });

  document.addEventListener("touchend", function() {
    if (!isDragging) return;
    isDragging = false;
    if (!hasMoved) toggleAppFullscreen();
  });

  function dragStart(e) {
    hasMoved = false; isDragging = true;
    startX = e.clientX; startY = e.clientY;
    const rect = dragBtn.getBoundingClientRect();
    initialLeft = rect.left; initialTop = rect.top;
  }

  function dragMove(e) {
    if (!isDragging) return;
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) hasMoved = true;

    let newLeft = initialLeft + deltaX;
    let newTop = initialTop + deltaY;
    const padding = 10;
    newLeft = Math.max(padding, Math.min(newLeft, window.innerWidth - dragBtn.offsetWidth - padding));
    newTop = Math.max(padding, Math.min(newTop, window.innerHeight - dragBtn.offsetHeight - padding));

    dragBtn.style.left = newLeft + "px";
    dragBtn.style.top = newTop + "px";
    dragBtn.style.right = "auto";
  }

  function dragEnd(e) {
    if (!isDragging) return;
    isDragging = false;
    if (hasMoved) {
      e.stopPropagation();
      const currentOnClick = dragBtn.onclick;
      dragBtn.onclick = null;
      setTimeout(() => { dragBtn.onclick = currentOnClick; }, 50);
    }
  }
});

function loadTickerNotifications() {
  callGAS("getActiveTickerNotifications", {}, function(newsList) {
    var container = document.getElementById("ticker-container");
    var marquee = document.getElementById("ticker-marquee");
    if (!container || !marquee) return;
    
    if (newsList && newsList.length > 0) {
      var html = "";
      newsList.forEach(function(item) {
        var textHtml = item.link 
          ? `<a href="${item.link}" target="_blank" class="ticker-item-link">${item.text} <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:10px;"></i></a>`
          : item.text;
          
        html += textHtml + ` <span style="margin: 0 15px; color: #f57f17;">●</span> `;
      });

      marquee.innerHTML = html;
      container.style.display = "flex";
    } else {
      container.style.display = "none";
    }
  });
}

function initLayoutMode() {
  let savedMode = localStorage.getItem("snec_portal_layout") || "classic";
  applyLayoutMode(savedMode);
}

function toggleLayoutMode() {
  let currentMode = localStorage.getItem("snec_portal_layout") || "classic";
  let newMode = (currentMode === "classic") ? "grid" : "classic";
  localStorage.setItem("snec_portal_layout", newMode);
  applyLayoutMode(newMode);
}

function applyLayoutMode(mode) {
  const bodyWrapper = document.getElementById("dashboard-page");
  const btnText = document.getElementById("view-btn-text");
  
  if (mode === "grid") {
    bodyWrapper.classList.add("layout-grid-mode");
    if(btnText) btnText.innerText = "Classic View";
  } else {
    bodyWrapper.classList.remove("layout-grid-mode");
    if(btnText) btnText.innerText = "Grid View";
  }
}

const categorySpecificImages = {
  "super admin": "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80",
  "quality management": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80",
  "administration": "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80",
  "faculty registry": "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80",
  "student matrix": "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=600&q=80",
  "academics": "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80",
  "assessments": "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80",
  "notice board": "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=600&q=80",
  "traffic analytics": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80",
  "live updates & quick links": "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=80",
  "analytics & logs": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80"
};

const defaultBanner = "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=600&q=80";

const categoryIcons = {
  "super admin": "fa-user-shield", "quality management": "fa-award", "administration": "fa-building-columns",
  "faculty registry": "fa-user-tie", "student matrix": "fa-graduation-cap", "academics": "fa-book-open",
  "assessments": "fa-file-signature", "notice board": "fa-bullhorn", "live updates & quick links": "fa-bolt",
  "portal traffic analytics": "fa-chart-line", "analytics & logs": "fa-folder-open"
};

function openCategoryModal(catName, subAppsJson) {
  const modal = document.getElementById("category-modal-overlay");
  const modalTitle = document.getElementById("category-modal-title");
  const modalContent = document.getElementById("category-modal-content");

  let iconClass = categoryIcons[catName.toLowerCase()] || "fa-folder";
  modalTitle.innerHTML = `<i class="fa-solid ${iconClass}"></i> ${catName}`;

  if (subAppsJson === "WIDGET_NOTICE") {
    const noticeElem = document.getElementById("notice-board-section-card");
    modalContent.innerHTML = noticeElem ? noticeElem.innerHTML : "<p>No Notice Data</p>";
  } 
  else if (subAppsJson === "WIDGET_TRAFFIC") {
    const trafficElem = document.getElementById("portal-traffic-section-card");
    modalContent.innerHTML = trafficElem ? trafficElem.innerHTML : "<p>No Traffic Data</p>";
  } 
  else if (subAppsJson === "WIDGET_LIVE") {
    const liveElem = document.getElementById("live-updates-section-card");
    if (liveElem) {
      modalContent.innerHTML = liveElem.innerHTML;
      const origItems = liveElem.querySelectorAll('.live-notice-item, .top-card');
      const modalItems = modalContent.querySelectorAll('.live-notice-item, .top-card');
      origItems.forEach((origEl, index) => {
        if (modalItems[index]) {
          modalItems[index].onclick = function(e) {
            closeCategoryModal();
            origEl.click();
          };
        }
      });
    } else { modalContent.innerHTML = "<p>No Live Updates</p>"; }
  } 
  else if (subAppsJson === "WIDGET_ANALYTICS") {
    const analyticsElem = document.getElementById("analytics-logs-section-card");
    modalContent.innerHTML = analyticsElem ? analyticsElem.innerHTML : "<p>No Logs Data</p>";
    if (analyticsElem) {
      const origItems = analyticsElem.querySelectorAll('.bottom-item-card');
      const modalItems = modalContent.querySelectorAll('.bottom-item-card');
      origItems.forEach((origEl, index) => {
        if (modalItems[index]) {
          modalItems[index].onclick = function(e) {
            closeCategoryModal();
            origEl.click();
          };
        }
      });
    }
  } 
  else {
    let subApps = JSON.parse(decodeURIComponent(subAppsJson));
    let subItemsHtml = `<div class="category-subapps-grid">`;
    subApps.forEach(sub => {
      subItemsHtml += `
        <div class="modal-subapp-item" onclick="openAppInPortalFromModal('${sub.name}', '${sub.link}')">
          <span>${sub.name}</span>
        </div>
      `;
    });
    subItemsHtml += `</div>`;
    modalContent.innerHTML = subItemsHtml;
  }

  modal.classList.add("active");
}

function closeCategoryModal() {
  const modal = document.getElementById("category-modal-overlay");
  if(modal) modal.classList.remove("active");
}

function openAppInPortalFromModal(appName, appUrl) {
  closeCategoryModal();
  openAppInPortal(appName, appUrl);
}

function encodeToHex(str) { let hex = ""; for (let i = 0; i < str.length; i++) { hex += str.charCodeAt(i).toString(16).padStart(2, '0'); } return hex; }
function decodeFromHex(hex) { try { let str = ""; for (let i = 0; i < hex.length; i += 2) { str += String.fromCharCode(parseInt(hex.substr(i, 2), 16)); } return str; } catch (e) { return ""; } }
function scrollTopNav(direction) { var container = document.getElementById("top-portal-navbar"); if (container) { container.scrollBy({ left: direction * 180, behavior: 'smooth' }); } }

function checkLocalStorageAuthEngine() {
  try {
    var savedUser = localStorage.getItem("loggedUser");
    if (savedUser) {
      var parsed = JSON.parse(savedUser);
      if (parsed && parsed.username && parsed.token) {
        var p = decodeFromHex(parsed.token); temporaryPasswordHolder = p;
        callGAS("checkLogin", { username: parsed.username, password: p }, function(res) {
          if(res && res.success) showDashboard(res); else showLoginPageImmediate();
        }, showLoginPageImmediate);
        return;
      }
    }
  } catch(e) {}
  showLoginPageImmediate();
}

function showLoginPageImmediate() { 
  var ls = document.getElementById("loading-screen"); if(ls) ls.style.display = "none"; 
  var dp = document.getElementById("dashboard-page"); if(dp) dp.style.display = "none"; 
  var lp = document.getElementById("login-page"); if(lp) lp.style.display = "flex"; 
}

function toggleSidebar() { document.getElementById("mainSidebar").classList.toggle("open"); document.getElementById("sidebarOverlay").classList.toggle("open"); }

function toggleDynamicSubMenu(event, submenuId, arrowId, mainName, mainUrl) {
  if(event) event.preventDefault();
  var submenu = document.getElementById(submenuId);
  var arrow = document.getElementById(arrowId);
  document.querySelectorAll('.sidebar-submenu-container').forEach(sm => { if (sm.id !== submenuId) sm.classList.remove('open'); });
  document.querySelectorAll('.fa-chevron-down').forEach(ar => { if (ar.id !== arrowId) ar.style.transform = "rotate(0deg)"; });
  
  submenu.classList.toggle("open");
  var parentItem = arrow.closest('.sidebar-item');
  if (submenu.classList.contains("open")) { 
    arrow.style.transform = "rotate(180deg)"; 
    if (parentItem) parentItem.classList.add("active"); 
  } else { 
    arrow.style.transform = "rotate(0deg)"; 
    if (parentItem) parentItem.classList.remove("active"); 
  }
}

function login() {
  var u = document.getElementById("username").value; var p = document.getElementById("password").value;
  if(!u || !p) { document.getElementById("error-msg").innerText = "Please fill all fields!"; return; }
  document.getElementById("error-msg").style.color = "#fc5c65"; document.getElementById("error-msg").innerText = "Verifying...";
  
  temporaryPasswordHolder = p;
  callGAS("checkLogin", { username: u, password: p }, function(res) {
    if(res && res.success) { 
      try { localStorage.setItem("loggedUser", JSON.stringify({username: u, token: encodeToHex(p)})); } catch(e) {} 
      showDashboard(res); 
    } else { 
      document.getElementById("error-msg").innerText = res ? res.message : "Login failed!"; 
    } 
  });
}

function loginAsGuest(type) {
  var u = (type === 'new teacher') ? 'guest_new_teacher' : 'guest_general';
  var p = 'bypass_pass';
  temporaryPasswordHolder = p;
  document.getElementById("loading-screen").style.display = "flex";
  callGAS("checkLogin", { username: u, password: p }, function(res) {
    if(res && res.success) { 
      try { localStorage.setItem("loggedUser", JSON.stringify({username: u, token: encodeToHex(p)})); } catch(e) {} 
      showDashboard(res); 
    } else { showLoginPageImmediate(); }
  }, showLoginPageImmediate);
}

function showDashboard(user) {
  document.getElementById("loading-screen").style.display = "none"; 
  document.getElementById("login-page").style.display = "none"; 
  document.getElementById("dashboard-page").style.display = "flex";
  
  document.getElementById("user-display-name").innerText = user.name || "Guest User"; 
  document.getElementById("user-role").innerText = user.role || "Visitor";
  
  userFullNameStr = user.name || "Guest User"; 
  userFullRole = user.role || "Visitor"; 
  loggedAffNo = user.username || "guest_general";

  var foundInst = user.institution || user.college || user.institutionName || user.inst || user.College || user.Institution;
  var foundStream = user.stream || user.Stream || user.dept || 'General';

  window.loggedInstitutionName = (foundInst && foundInst !== 'undefined') ? foundInst : 'Central Office';
  window.loggedStreamName = (foundStream && foundStream !== 'undefined') ? foundStream : 'General';
  
  callGAS("getDashboardData", { userRole: user.role, username: loggedAffNo }, renderLinks);
  
  if(loggedAffNo !== 'guest_new_teacher' && loggedAffNo !== 'guest_general') {
    fetchAttendanceInitialData();
  }
  
  loadLiveNotifications();
  loadTickerNotifications();
}

function updateLiveTrafficStats() {
  callGAS("getVisitStats", {}, function(stats) {
    if(stats) {
      document.getElementById('stats-today').innerText = stats.today;
      document.getElementById('stats-total').innerText = stats.total;
    }
  });
}

function cleanDriveImageUrl(url) { if (!url) return ""; let urlStr = url.toString().replace(/\s+/g, '').trim(); if (urlStr.includes("drive.google.com")) { let fileId = ""; if (urlStr.includes("/d/")) fileId = urlStr.split("/d/")[1].split("/")[0]; else if (urlStr.includes("id=")) fileId = urlStr.split("id=")[1].split("&")[0]; if (fileId) return "https://drive.google.com/thumbnail?sz=w1200&id=" + fileId; } return urlStr; }

function renderLinks(data) {
  if(!data) return; allLinksData = data; userCollegeStr = data.college || "Central Office"; userStreamStr = data.stream || "General";
  
  callGAS("logPortalActivity", {
    username: loggedAffNo, name: userFullNameStr, role: userFullRole, college: userCollegeStr, stream: userStreamStr, appAction: "Opened Dashboard"
  }, function() { updateLiveTrafficStats(); });
  
  if (data.studentRealName && data.studentRealName !== "") {
    document.getElementById("user-display-name").innerText = data.studentRealName;
    userFullNameStr = data.studentRealName;
  }

  if (data.userImg) { document.getElementById("user-profile-pic").src = data.userImg.startsWith("data:") ? data.userImg : cleanDriveImageUrl(data.userImg); }
  
  var topNav = document.getElementById("top-portal-navbar"); var rightApp = document.getElementById("right-apps"); var bottomApp = document.getElementById("bottom-links-box"); var mobilePortal = document.getElementById("sidebar-mobile-portals");
  var modernGridContainer = document.getElementById("modern-grid-apps");
  
  topNav.innerHTML = ""; rightApp.innerHTML = ""; bottomApp.innerHTML = ""; mobilePortal.innerHTML = "";
  if (modernGridContainer) modernGridContainer.innerHTML = "";
  
  data.top.forEach(item => { if (!item.parent) topNav.innerHTML += `<a class="top-nav-item" onclick="openAppInPortal('${item.name}', '${item.link}')">${item.name}</a>`; });
  
  if(data.top.length > 0) { 
    mobilePortal.innerHTML = `<div style="padding: 15px 25px 5px 25px; font-size: 11px; font-weight: 800; color: #05c46b; text-transform: uppercase; letter-spacing: 1px;">Top Portals</div>`; 
    data.top.forEach(item => { mobilePortal.innerHTML += `<a class="sidebar-item" onclick="openAppInPortal('${item.name}', '${item.link}', this)"><i class="fa-solid fa-circle-nodes" style="font-size:13px;"></i> <span>${item.name}</span></a>`; }); 
  }

  var sidebarHtml = `<a id="side-home" class="sidebar-item active" onclick="switchPanel('home')"><i class="fa-solid fa-house"></i> <span>Home</span></a>`;
  var mainItems = data.left.filter(item => !item.parent); var subItems = data.left.filter(item => item.parent);
  
  mainItems.forEach((mainItem, mainIdx) => {
    var children = subItems.filter(sub => sub.parent.trim().toLowerCase() === mainItem.name.trim().toLowerCase());
    
    if (modernGridContainer) {
      var targetAppsList = children.length > 0 ? children : [{name: mainItem.name, link: mainItem.link}];
      var encodedList = encodeURIComponent(JSON.stringify(targetAppsList));
      var bgImg = categorySpecificImages[mainItem.name.toLowerCase()] || defaultBanner;

      modernGridContainer.innerHTML += `
        <div class="uni-visual-card" onclick="openCategoryModal('${mainItem.name}', '${encodedList}')">
          <img class="uni-card-banner-img" src="${bgImg}" alt="${mainItem.name}" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=600&q=80';">
          <div class="uni-card-label-box">${mainItem.name}</div>
        </div>
      `;
    }

    if (children.length > 0) {
      var submenuId = "sm-" + mainIdx; var arrowId = "ar-" + mainIdx;
      var mainIcon = mainItem.name.toLowerCase().includes("teacher") ? '<i class="fa-solid fa-user-tie"></i> ' : '<i class="fa-solid fa-folder"></i> ';
      
      sidebarHtml += `<div class="sidebar-dropdown-wrapper">
        <a id="menu-${mainIdx}" class="sidebar-item" onclick="toggleDynamicSubMenu(event, '${submenuId}', '${arrowId}', '${mainItem.name}', '${mainItem.link}')">
          ${mainIcon} <span>${mainItem.name}</span>
          <i class="fa-solid fa-chevron-down" id="${arrowId}" style="margin-left:auto; font-size:11px; transition:0.3s;"></i>
        </a><div id="${submenuId}" class="sidebar-submenu-container">`;
      
      children.forEach(child => { 
        sidebarHtml += `<a class="submenu-item" onclick="openAppInPortal('${child.name}', '${child.link}', this)">${child.name}</a>`; 
      });
      sidebarHtml += `</div></div>`;
    } else {
      var icon = mainItem.name.toLowerCase().includes("attendance") ? '<i class="fa-solid fa-calendar-check"></i> ' : '<i class="fa-solid fa-link"></i> ';
      if (mainItem.name.toLowerCase().includes("score") || mainItem.name.toLowerCase().includes("rank")) icon = '<i class="fa-solid fa-chart-pie"></i> ';
      sidebarHtml += `<a class="sidebar-item" onclick="openAppInPortal('${mainItem.name}', '${mainItem.link}', this)">${icon} <span>${mainItem.name}</span></a>`;
    }
  });

  if (modernGridContainer) {
    var extraVisualCards = [
      { name: "Notice Board", type: "WIDGET_NOTICE" },
      { name: "Traffic Analytics", type: "WIDGET_TRAFFIC" },
      { name: "Live Updates & Links", type: "WIDGET_LIVE" },
      { name: "Analytics & Logs", type: "WIDGET_ANALYTICS" }
    ];

    extraVisualCards.forEach((item) => {
      var bgImg = categorySpecificImages[item.name.toLowerCase()] || defaultBanner;
      modernGridContainer.innerHTML += `
        <div class="uni-visual-card" onclick="openCategoryModal('${item.name}', '${item.type}')">
          <img class="uni-card-banner-img" src="${bgImg}" alt="${item.name}" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=600&q=80';">
          <div class="uni-card-label-box">${item.name}</div>
        </div>
      `;
    });
  }

  document.getElementById("sidebar-menu-container").innerHTML = sidebarHtml;
  
  data.right.concat(data.centre).forEach(item => rightApp.innerHTML += `<div class="top-card" onclick="openAppInPortal('${item.name}', '${item.link}')"><span>${item.name}</span><i class="fa-solid fa-chevron-right" style="color:#1e3c72; font-size:12px;"></i></div>`);
  if(data.bottom) data.bottom.forEach(item => bottomApp.innerHTML += `<div class="bottom-item-card" onclick="openAppInPortal('${item.name}', '${item.link}')"><span>${item.name}</span></div>`);
  
  if (data.notice && data.notice.length > 0) {
    var slidesHtml = ""; var dotsHtml = "";
    data.notice.forEach(function(item, idx) { slidesHtml += `<div class="carousel-slide"><img src="${cleanDriveImageUrl(item.link)}" alt="${item.name}"><div class="carousel-caption">${item.name}</div></div>`; dotsHtml += `<span class="dot" onclick="setCurrentSlide(${idx})"></span>`; });
    document.getElementById("carousel-slides-container").innerHTML = slidesHtml; document.getElementById("carousel-dots-container").innerHTML = dotsHtml; startNoticeCarousel();
  }
}

function startNoticeCarousel() { carouselIndex = 0; updateSlidePosition(); if(carouselTimer) clearInterval(carouselTimer); carouselTimer = setInterval(nextSlide, 4000); }

function updateSlidePosition() {
  let track = document.getElementById("carousel-slides-container"); let slides = document.getElementsByClassName("carousel-slide"); let dots = document.getElementsByClassName("dot"); if (slides.length === 0) return;
  if (carouselIndex >= slides.length) carouselIndex = 0; if (carouselIndex < 0) { carouselIndex = slides.length - 1; }
  track.style.transform = "translateX(" + (-carouselIndex * 100) + "%)";
  for (let i = 0; i < dots.length; i++) dots[i].className = dots[i].className.replace(" active", ""); if(dots[carouselIndex]) dots[carouselIndex].className += " active";
}

function nextSlide() { carouselIndex++; updateSlidePosition(); } 
function prevSlide() { carouselIndex--; updateSlidePosition(); } 
function setCurrentSlide(idx) { carouselIndex = idx; updateSlidePosition(); resetTimer(); } 
function resetTimer() { clearInterval(carouselTimer); carouselTimer = setInterval(nextSlide, 4000); }

function closeSidebarOnMobile() {
  var sidebar = document.querySelector('.sidebar') || document.getElementById('sidebar');
  var overlay = document.querySelector('.sidebar-overlay');
  if (sidebar) { sidebar.classList.remove('active', 'show', 'open'); }
  if (overlay) { overlay.style.display = 'none'; }
}

function openAppInPortal(appName, appUrl, element) {
  if (!appUrl || appUrl === '#') {
    alert("ഈ മെനുവിനുള്ള ലിങ്ക് ലഭ്യമായിട്ടില്ല!");
    return;
  }
  
  if(element) {
    document.querySelectorAll('.sidebar-menu li').forEach(li => li.classList.remove('active'));
    element.classList.add('active');
  }

  closeSidebarOnMobile();

  var currentUsername = typeof loggedAffNo !== 'undefined' ? loggedAffNo : 'admin';
  var currentName = typeof userFullNameStr !== 'undefined' ? userFullNameStr : 'ME';
  var currentRole = typeof userFullRole !== 'undefined' ? userFullRole : 'Super Admin';
  var currentCollege = window.loggedInstitutionName || 'Central Office';
  var currentStream = window.loggedStreamName || 'General';
  
  callGAS("logPortalActivity", {
    username: currentUsername, name: currentName, role: currentRole, college: currentCollege, stream: currentStream, appAction: "Accessed App: " + appName
  });

  if (appUrl.startsWith("http://") || appUrl.startsWith("https://")) {
    document.getElementById("panel-home").style.display = "none";
    var appView = document.getElementById("panel-appview");
    appView.style.display = "block";
    
    appView.innerHTML = `
      <div id="appContainerFrame" style="position: relative; width: 100%; height: calc(100vh - 160px); border-radius: 15px; overflow: hidden; box-shadow: 0 8px 25px rgba(0,0,0,0.05); background-color: #ffffff;">
        <iframe id="subAppIframe" src="${appUrl}" style="width:100%; height:100%; border:none;" allow="geolocation; microphone; camera"></iframe>
        <div id="draggableControlGroup" style="position: absolute; bottom: 30px; right: 30px; display: flex; flex-direction: column; gap: 12px; z-index: 2147483647; background: rgba(30, 60, 114, 0.15); padding: 8px; border-radius: 40px; backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.25); cursor: move; user-select: none;">
          <div style="text-align: center; color: rgba(255,255,255,0.7); font-size: 10px; margin-bottom: -4px; cursor: move;"><i class="fa-solid fa-grip-lines"></i></div>
          <button onclick="window.toggleSubAppFullScreen()" id="fs-btn-main" title="Full Screen Toggle" style="width: 48px; height: 48px; border-radius: 50%; background-color: #05c46b; color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.3); transition: transform 0.2s;">
            <i id="fs-icon" class="fa-solid fa-expand" style="font-size: 18px;"></i>
          </button>
          <button onclick="window.goBackToHomeSub()" title="Go Home" style="width: 48px; height: 48px; border-radius: 50%; background-color: #1e3c72; color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.3); transition: transform 0.2s;">
            <i class="fa-solid fa-house" style="font-size: 16px;"></i>
          </button>
          <button onclick="window.goSubAppBack()" title="Go Back" style="width: 48px; height: 48px; border-radius: 50%; background-color: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.2); transition: transform 0.2s;">
            <i class="fa-solid fa-arrow-left" style="font-size: 16px;"></i>
          </button>
        </div>
      </div>
    `;
    setTimeout(initDraggableControls, 100);
    return;
  } else {
    if(typeof showInternalPage === 'function') { showInternalPage(appUrl); } 
    else {
      document.getElementById("panel-appview").style.display = "none";
      document.getElementById("panel-home").style.display = "block";
    }
  }
}

window.toggleSubAppFullScreen = function() {
  var container = document.getElementById('appContainerFrame');
  var icon = document.getElementById('fs-icon');
  var btn = document.getElementById('fs-btn-main');
  if (!container) return;

  if (!document.fullscreenElement) {
    if (container.requestFullscreen) { container.requestFullscreen(); }
    else if (container.webkitRequestFullscreen) { container.webkitRequestFullscreen(); }
    icon.classList.remove('fa-expand'); icon.classList.add('fa-compress');
    btn.style.backgroundColor = '#fc5c65'; btn.title = "Exit Full Screen";
  } else {
    if (document.exitFullscreen) { document.exitFullscreen(); }
    icon.classList.remove('fa-compress'); icon.classList.add('fa-expand');
    btn.style.backgroundColor = '#05c46b'; btn.title = "Full Screen";
  }
};

document.addEventListener('fullscreenchange', function() {
  var icon = document.getElementById('fs-icon'); var btn = document.getElementById('fs-btn-main');
  if(!icon || !btn) return;
  if (!document.fullscreenElement) {
    icon.classList.remove('fa-compress'); icon.classList.add('fa-expand');
    btn.style.backgroundColor = '#05c46b';
  }
});

function initDraggableControls() {
  var el = document.getElementById("draggableControlGroup"); if (!el) return;
  var x = 0, y = 0, nx = 0, ny = 0;
  el.onmousedown = dragMouseDown; el.ontouchstart = dragMouseDown;

  function dragMouseDown(e) {
    e = e || window.event;
    if(e.type !== 'touchstart') e.preventDefault();
    var clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    var clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
    nx = clientX; ny = clientY;
    document.onmouseup = closeDragElement; document.ontouchend = closeDragElement;
    document.onmousemove = elementDrag; document.ontouchmove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    var clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    var clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
    x = nx - clientX; y = ny - clientY; nx = clientX; ny = clientY;
    el.style.top = (el.offsetTop - y) + "px"; el.style.left = (el.offsetLeft - x) + "px";
    el.style.bottom = "auto"; el.style.right = "auto";
  }

  function closeDragElement() {
    document.onmouseup = null; document.ontouchend = null;
    document.onmousemove = null; document.ontouchmove = null;
  }
}

window.goSubAppBack = function() {
  var iframe = document.getElementById('subAppIframe');
  if (iframe && iframe.contentWindow) {
    try { iframe.contentWindow.history.back(); } catch (e) { window.goBackToHomeSub(); }
  } else { window.goBackToHomeSub(); }
};

window.goBackToHomeSub = function() {
  if (document.fullscreenElement) { document.exitFullscreen(); }
  document.getElementById("panel-appview").style.display = "none";
  document.getElementById("panel-home").style.display = "block";
  document.querySelectorAll('.sidebar-menu li').forEach(li => li.classList.remove('active'));
  var homeMenu = document.querySelector('.sidebar-menu li[onclick*="home"]') || document.querySelector('.sidebar-menu li');
  if(homeMenu) homeMenu.classList.add('active');
};

function toggleAppFullscreen() {
  const contentScreen = document.querySelector('.content-screen');
  const btn = document.getElementById('fs-toggle-btn');
  const isFullscreen = contentScreen.classList.contains('fullscreen-active');
  if (!isFullscreen) {
    contentScreen.classList.add('fullscreen-active');
    btn.innerHTML = `<i class="fa-solid fa-compress"></i>`;
    document.getElementById("float-home").style.display = "none";
    document.getElementById("float-back").style.display = "none";
  } else {
    contentScreen.classList.remove('fullscreen-active');
    btn.innerHTML = `<i class="fa-solid fa-expand"></i>`;
    document.getElementById("float-home").style.display = "flex";
    document.getElementById("float-back").style.display = "flex";
  }
}

function switchPanel(panelId) {
  var panels = document.querySelectorAll('.panel-content');
  panels.forEach(function(panel) { panel.style.display = 'none'; });

  var appViewPanel = document.getElementById("panel-appview");
  if (appViewPanel) { appViewPanel.style.display = "none"; appViewPanel.innerHTML = ""; }

  var targetPanel = document.getElementById('panel-' + panelId);
  if (targetPanel) { targetPanel.style.display = 'block'; }

  document.querySelectorAll('.sidebar-menu li, .sidebar-item').forEach(function(item) { item.classList.remove('active'); });

  var activeItem = document.getElementById('side-' + panelId);
  if (activeItem) { activeItem.classList.add('active'); }

  if (panelId === 'home') {
    var currentUsername = typeof loggedAffNo !== 'undefined' ? loggedAffNo : 'admin';
    var currentName = typeof userFullNameStr !== 'undefined' ? userFullNameStr : 'ME';
    var currentRole = typeof userFullRole !== 'undefined' ? userFullRole : 'Super Admin';
    var currentCollege = window.loggedInstitutionName || 'Central Office';
    var currentStream = window.loggedStreamName || 'General';

    callGAS("logPortalActivity", {
      username: currentUsername, name: currentName, role: currentRole, college: currentCollege, stream: currentStream, appAction: "Opened Dashboard Home"
    });
  }
}

function fetchAttendanceInitialData() { 
  callGAS("getInitialData", { loggedAffNo: loggedAffNo }, function(res) { 
    if(!res) return; 
    document.getElementById('dateInput').innerHTML = res.dates.map(d => `<option value="${d}">${d}</option>`).join(''); 
    document.getElementById('classSel').innerHTML = '<option value="All">All Classes</option>' + res.classes.map(c => `<option value="${c}">${c}</option>`).join(''); 
    loadAttendanceData(); 
  });
}

function loadAttendanceData() {
  const date = document.getElementById('dateInput').value; const cls = document.getElementById('classSel').value; const tableBody = document.getElementById('periodTableBody'); if(!date) return;
  tableBody.innerHTML = '<tr><td colspan="11" style="text-align:center; padding:20px; color:#999;">Loading...</td></tr>';
  
  callGAS("filterDashboard", { loggedAffNo: loggedAffNo, selectedDate: date, selectedClass: cls }, function(res) {
    if(!res) return; document.getElementById('st-total').innerText = res.totalStudents || 0; document.getElementById('st-present').innerText = res.presentCount || 0; document.getElementById('st-absent').innerText = res.absentCount || 0;
    if(res.classSummary && res.classSummary.length > 0) { tableBody.innerHTML = res.classSummary.map(clsData => { let row = `<tr><td style="font-weight:600;">${clsData.className}</td><td style="text-align:center; color:#1e3c72; font-weight:bold;">${clsData.classTotal}</td>`; for (let i = 1; i <= 9; i++) { let p = clsData.periods[i.toString()]; if (p) row += `<td><span style="font-size:12px; font-weight:600; display:block;">${p.subject}</span><span style="color:#05c46b; font-size:11px;">P:${p.p}</span> | <span style="color:#fc5c65; font-size:11px;">A:${p.a}</span></td>`; else row += `<td style="text-align:center; color:#aaa;">-</td>`; } return row + `</tr>`; }).join(''); } else tableBody.innerHTML = '<tr><td colspan="11" style="text-align:center;">No Data</td></tr>';
  });
}

function logout() { 
  try { 
    var appWin = document.getElementById("app-window"); if(appWin) appWin.src = "";
    sessionStorage.clear(); localStorage.removeItem("loggedUser"); 
    document.getElementById("dashboard-page").style.display = "none"; document.getElementById("loading-screen").style.display = "none";
    var loginPage = document.getElementById("login-page"); if(loginPage) loginPage.style.display = "flex";
    if(document.getElementById("username")) document.getElementById("username").value = "";
    if(document.getElementById("password")) document.getElementById("password").value = "";
    if(document.getElementById("error-msg")) document.getElementById("error-msg").innerText = "";
  } catch(e) { location.reload(); } 
}

function loadLiveNotifications() {
  const role = userFullRole ? userFullRole.toLowerCase() : '';
  const affNo = loggedAffNo ? loggedAffNo.toLowerCase() : '';

  if (role === 'new teacher' || role === 'general' || affNo === 'guest_new_teacher' || affNo === 'guest_general') {
    const liveSectionCard = document.getElementById('live-notifications-box')?.closest('.section-card');
    if (liveSectionCard) { liveSectionCard.style.display = 'none'; }
    return; 
  }

  const container = document.getElementById('live-notifications-box');
  if (!container) return;

  container.innerHTML = '<p style="color:#999; text-align:center; font-size:12px; font-style:italic; padding:10px;">Loading updates...</p>';
  
  const EXTERNAL_SHEET_ID = '1e5QF419ek5mWfZbKgilDCcKnTuJrjqwSP4jzrDei4IU'; 
  const urlSheet1 = "https://docs.google.com/spreadsheets/d/" + EXTERNAL_SHEET_ID + "/gviz/tq?sheet=Sheet1&tqx=out:json&v=" + new Date().getTime();
  const urlSheet2 = "https://docs.google.com/spreadsheets/d/" + EXTERNAL_SHEET_ID + "/gviz/tq?sheet=Sheet2&tqx=out:json&v=" + new Date().getTime();

  Promise.all([
    fetch(urlSheet1).then(res => res.text()),
    fetch(urlSheet2).then(res => res.text())
  ])
  .then(([text1, text2]) => {
    const jsonText1 = text1.substring(text1.indexOf('{'), text1.lastIndexOf('}') + 1);
    const data1 = JSON.parse(jsonText1);
    const jsonText2 = text2.substring(text2.indexOf('{'), text2.lastIndexOf('}') + 1);
    const data2 = JSON.parse(jsonText2);

    let iconMapping = {};
    if (data2 && data2.table && data2.table.rows) {
      data2.table.rows.forEach(row => {
        if (row.c && row.c[0] && row.c[0].v) {
          const catName = row.c[0].v.toString().trim().toLowerCase();
          const dispIcon = row.c[1] ? row.c[1].v : '';
          iconMapping[catName] = dispIcon;
        }
      });
    }

    const today = new Date(); today.setHours(0, 0, 0, 0);
    let validRows = [];

    if (data1 && data1.table && data1.table.rows) {
      data1.table.rows.forEach(row => {
        const cells = row.c;
        if (!cells || !cells[0] || cells[0].v === null || !cells[2] || cells[2].v === null) return; 

        const startDate = parseGvizDate(cells[0].v);
        const endDate = parseGvizDate(cells[2].v);

        if (startDate && endDate && (startDate instanceof Date) && (endDate instanceof Date)) {
          const content = cells[1] ? cells[1].v : 'No Content';
          const linkOrText = cells[3] && cells[3].v !== null ? cells[3].v.toString().trim() : '';
          const category = cells[4] ? cells[4].v : 'default';
          const catKey = category.toString().trim().toLowerCase(); 

          const visibleToVal = cells[5] && cells[5].v !== null ? cells[5].v.toString().trim().toLowerCase() : '';

          let isPermitted = false;
          if (visibleToVal === '' || visibleToVal === 'all') { isPermitted = true; }
          else {
            const allowedRoles = visibleToVal.split(',').map(r => r.trim());
            if (allowedRoles.includes(role)) { isPermitted = true; } 
            else if ((role === 'parent' || role === 'student') && (allowedRoles.includes('parent/student') || allowedRoles.includes('parent / student'))) { isPermitted = true; }
          }

          if (isPermitted && today >= startDate && today <= endDate) {
            validRows.push({
              startDate: startDate.getTime(), content: content, linkData: linkOrText, cat: catKey
            });
          }
        }
      });
    }

    validRows.reverse();
    localStorage.setItem("snec_live_notices_secure", JSON.stringify(validRows));
    localStorage.setItem("snec_icon_mapping", JSON.stringify(iconMapping));
    renderLiveNoticesHTML(validRows, iconMapping);
  })
  .catch(err => {
    console.error('Error loading data:', err);
    const savedNotices = localStorage.getItem("snec_live_notices_secure");
    const savedIcons = JSON.parse(localStorage.getItem("snec_icon_mapping") || "{}");
    if(savedNotices) { renderLiveNoticesHTML(JSON.parse(savedNotices), savedIcons); }
    else { container.innerHTML = '<p style="color:#fc5c65; text-align:center; font-size:12px; font-weight:600; padding:10px;">Network Timeout!</p>'; }
  });
}

function renderLiveNoticesHTML(noticeArray, iconMapping) {
  const container = document.getElementById('live-notifications-box'); 
  if (!container) return;
  container.innerHTML = '';
  if (!iconMapping) { iconMapping = JSON.parse(localStorage.getItem("snec_icon_mapping") || "{}"); }
  const today = new Date(); today.setHours(0, 0, 0, 0);

  if (noticeArray && noticeArray.length > 0) {
    noticeArray.forEach(item => {
      const currentCat = item.cat ? item.cat : 'default';
      let targetIcon = iconMapping[currentCat] || iconMapping['default'] || '🔔'; 

      const itemElement = document.createElement('div'); 
      itemElement.className = `live-notice-item notice-cat-${currentCat}`; 
      itemElement.style.cursor = 'pointer';

      const dData = (item.linkData || item.link || '').trim();
      const isRealUrl = /^(http:\/\/|https:\/\/|www\.)/i.test(dData);

      itemElement.onclick = function() {
        if (isRealUrl) {
          let targetUrl = dData;
          if (targetUrl.toLowerCase().startsWith("www.")) { targetUrl = "https://" + targetUrl; }
          const lowLink = targetUrl.toLowerCase();
          if (lowLink.includes("youtube.com") || lowLink.includes("youtu.be") || lowLink.includes("t.me") || lowLink.includes("whatsapp.com")) {
            window.open(targetUrl, '_blank');
          } else if (lowLink.includes("drive.google.com") && (lowLink.includes("view") || lowLink.includes("id=") || lowLink.includes("thumbnail"))) {
            openPremiumPreview(cleanDriveImageUrl(targetUrl), item.content);
          } else { openAppInPortal(item.content, targetUrl); }
        } else {
          var textToShow = dData !== "" ? dData : item.content;
          openNoticePopupModal(item.content, textToShow);
        }
      };

      const diffDays = Math.ceil(Math.abs(today.getTime() - item.startDate) / (1000 * 60 * 60 * 24)); 
      if (diffDays <= 2) { itemElement.classList.add('notice-pulse'); }

      const isImage = isRealUrl && dData.includes("drive.google.com") && (dData.includes("view") || dData.includes("id="));
      const isExternal = isRealUrl && (dData.includes("youtube.com") || dData.includes("youtu.be") || dData.includes("t.me") || dData.includes("whatsapp.com"));
      
      let actionIcon = isRealUrl ? (isImage ? 'fa-magnifying-glass-plus' : (isExternal ? 'fa-arrow-up-right-from-square' : 'fa-circle-chevron-right')) : 'fa-comment-dots';

      itemElement.innerHTML = `
        <div class="notice-icon" style="display: flex; align-items: center; justify-content: center; background: #f0f4f8; width: 32px; height: 32px; border-radius: 50%; min-width: 32px; font-size: 16px;">
          ${targetIcon}
        </div>
        <div style="flex:1; padding-left:10px; padding-right:5px; font-size:13px; font-weight:600; color:#333;">${item.content}</div>
        <i class="fa-solid ${actionIcon}" style="font-size:13px; opacity:0.7; margin-left:8px; color:#1e3c72;"></i>
      `;
      container.appendChild(itemElement);
    });
  } else { container.innerHTML = '<p style="color:#999; text-align:center; font-size:13px; font-style:italic; padding:10px;">No new live updates today.</p>'; }
}

function openNoticePopupModal(titleHeader, mainTextBody) {
  var modal = document.getElementById("premium-preview-modal");
  var img = document.getElementById("preview-modal-img");
  var title = document.getElementById("preview-modal-title");
  
  if(modal) {
    if(img) img.style.display = "none";
    var customBox = document.getElementById("custom-notice-popup-box");
    if(!customBox) {
      customBox = document.createElement("div"); customBox.id = "custom-notice-popup-box"; modal.appendChild(customBox);
    } else { customBox.style.display = "block"; }
    
    customBox.style.cssText = "background: #ffffff; color: #1e293b; padding: 28px 25px; border-radius: 20px; max-width: 90vw; width: 460px; text-align: center; box-shadow: 0 25px 50px rgba(220, 38, 38, 0.25); font-size: 15px; line-height: 1.6; border: 2.5px solid #dc2626; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 10001; box-sizing: border-box;";
    
    let formattedBody = mainTextBody
      .split(/\r?\n/)
      .filter(para => para.trim() !== '')
      .map(para => `<p style="margin-bottom: 12px; text-align: justify; line-height: 1.6;">${para.trim()}</p>`)
      .join('');

    customBox.innerHTML = `
      <div style="width: 55px; height: 55px; background: #fee2e2; color: #dc2626; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px auto; font-size: 26px; border: 2px solid #fca5a5; animation: blink 1.5s infinite;">
        <i class="fa-solid fa-triangle-exclamation"></i>
      </div>
      <div style="font-size: 17px; font-weight: 800; color: #dc2626; margin-bottom: 15px; border-bottom: 1.5px dashed #fca5a5; padding-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;">
        ${titleHeader}
      </div>
      <div style="color: #334155; font-weight: 500; font-size: 14px; margin-bottom: 22px; max-height: 50vh; overflow-y: auto; padding-right: 5px; word-break: break-word;">
        ${formattedBody}
      </div>
      <button onclick="closeNoticePopupModal()" style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; border: none; padding: 12px 35px; border-radius: 30px; font-weight: 700; cursor: pointer; font-size: 14px; box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3); transition: transform 0.2s;">
        <i class="fa-solid fa-check" style="margin-right: 6px;"></i> OK, UNDERSTOOD
      </button>
    `;
    if(title) title.innerText = "Urgent Notice";
    modal.style.display = "flex";
  } else { alert(titleHeader + "\n\n" + mainTextBody); }
}

function closeNoticePopupModal() {
  var modal = document.getElementById("premium-preview-modal");
  var customBox = document.getElementById("custom-notice-popup-box");
  if(modal) modal.style.display = "none";
  if(customBox) customBox.style.display = "none";
}

function parseGvizDate(gvizDate) {
  if (!gvizDate) return null;
  if (typeof gvizDate === 'string' && gvizDate.startsWith('Date(')) {
    const match = gvizDate.match(/Date\((\d+),(\d+),(\d+)\)/);
    if (match) { const date = new Date(match[1], match[2], match[3]); date.setHours(0, 0, 0, 0); return date; }
  }
  if (typeof gvizDate === 'string' && gvizDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const parts = gvizDate.split('-');
    const date = new Date(parts[0], parts[1] - 1, parts[2]); date.setHours(0, 0, 0, 0); return date;
  }
  const dateFromStr = new Date(gvizDate);
  if (!isNaN(dateFromStr.getTime())) { dateFromStr.setHours(0, 0, 0, 0); return dateFromStr; }
  return null;
}

function openPremiumPreview(imgSrc, titleText) {
  if(!imgSrc || imgSrc === "#") { alert("ഫയൽ ലിങ്ക് ലഭ്യമല്ല!"); return; }
  document.getElementById("preview-modal-img").src = imgSrc;
  document.getElementById("preview-modal-title").innerText = titleText || "Notice Document";
  document.getElementById("premium-preview-modal").style.display = "flex";
}

function closePremiumPreview() {
  document.getElementById("premium-preview-modal").style.display = "none"; document.getElementById("preview-modal-img").src = "";
}

document.addEventListener("click", function(e) {
  const img = e.target.closest("#notice-board-section-card img, .carousel-container img");
  if (img) {
    e.preventDefault();
    let captionText = img.alt || "Image View";
    const captionEl = img.nextElementSibling;
    if (captionEl && captionEl.classList.contains("carousel-caption")) {
      captionText = captionEl.textContent || captionEl.innerText;
    } else {
      const parentSlide = img.closest(".carousel-slide");
      if (parentSlide) {
        const slideCaption = parentSlide.querySelector(".carousel-caption");
        if (slideCaption) captionText = slideCaption.textContent || slideCaption.innerText;
      }
    }
    openImageLightbox(img.src, captionText);
  }
});

function openImageLightbox(src, caption) {
  const modal = document.getElementById("image-lightbox-modal");
  const img = document.getElementById("image-lightbox-img");
  const cap = document.getElementById("image-lightbox-caption");
  if (!modal || !img) return;
  img.src = src;
  if (caption && caption.trim() !== "" && caption !== "Image View") {
    cap.innerText = caption; cap.style.display = "block";
  } else { cap.style.display = "none"; }
  modal.classList.add("active"); document.body.style.overflow = "hidden";
}

function closeImageLightbox(event, force = false) {
  if (force || (event && (event.target.id === "image-lightbox-modal" || event.target.classList.contains("image-lightbox-close")))) {
    const modal = document.getElementById("image-lightbox-modal");
    const img = document.getElementById("image-lightbox-img");
    if (!modal) return;
    modal.classList.remove("active"); document.body.style.overflow = "";
    setTimeout(() => { if (!modal.classList.contains("active") && img) img.src = ""; }, 300);
  }
}

document.addEventListener("keydown", function(e) { if (e.key === "Escape") closeImageLightbox(null, true); });
