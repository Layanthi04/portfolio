/* tells the stylesheet that JavaScript is running (used by the scroll-reveal) */
document.documentElement.classList.add("js");


/* ============ SHARED HELPERS ============ */
const SVG_NS = "http://www.w3.org/2000/svg";

/* builds an element with optional class name and text */
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/* builds a small icon that points at a symbol in the icon library at the top of index.html */
function icon(id, extraClass) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "btn-ico" + (extraClass ? " " + extraClass : ""));
  svg.setAttribute("aria-hidden", "true");
  const use = document.createElementNS(SVG_NS, "use");
  use.setAttribute("href", "#" + id);
  svg.append(use);
  return svg;
}


/* ============ NAVBAR ============ */
const navbar = document.getElementById("navbar");
const navToggle = document.getElementById("navToggle");
const navMenu = document.getElementById("navMenu");
const navLinks = document.querySelectorAll(".nav-link");
const sections = document.querySelectorAll("main section[id]");

/* 1. Add a stronger background once the page is scrolled,
      and highlight "Contact Me" when the very bottom of the page is reached */
function handleNavbarScroll() {
  navbar.classList.toggle("scrolled", window.scrollY > 20);

  const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
  if (atBottom) {
    navLinks.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === "#contact");
    });
  }
}
window.addEventListener("scroll", handleNavbarScroll, { passive: true });
handleNavbarScroll();

/* 2. Open / close the mobile menu */
function setMenu(open) {
  navMenu.classList.toggle("open", open);
  navToggle.classList.toggle("open", open);
  navToggle.setAttribute("aria-expanded", String(open));
  navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}

navToggle.addEventListener("click", () => {
  setMenu(!navMenu.classList.contains("open"));
});

/* 3. Close the menu when a link is clicked */
navLinks.forEach((link) => {
  link.addEventListener("click", () => setMenu(false));
});

/* 4. Close the menu with Escape, or when the screen becomes wide again */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") setMenu(false);
});
window.addEventListener("resize", () => {
  if (window.innerWidth > 960) setMenu(false);
});

/* 5. Highlight the link of the section currently on screen */
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        navLinks.forEach((link) => {
          link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
        });
      }
    });
  },
  { rootMargin: "-45% 0px -50% 0px" }
);
sections.forEach((section) => observer.observe(section));


/* ============ HERO: TYPING ANIMATION ============ */
const typedEl = document.getElementById("typed");
const titles = [
  "BICT Undergraduate",
  "Aspiring Quality Assurance Engineer",
  "Aspiring UI/UX Designer",
];

const TYPE_SPEED = 70;     // ms per letter typed
const DELETE_SPEED = 40;   // ms per letter deleted
const PAUSE_AFTER = 1600;  // pause once a title is fully typed
const PAUSE_BEFORE = 400;  // pause before typing the next title

let titleIndex = 0;
let charIndex = 0;
let deleting = false;

function typeLoop() {
  const current = titles[titleIndex];

  if (!deleting) {
    charIndex++;
    typedEl.textContent = current.slice(0, charIndex);
    if (charIndex === current.length) {
      deleting = true;
      return setTimeout(typeLoop, PAUSE_AFTER);
    }
    return setTimeout(typeLoop, TYPE_SPEED);
  }

  charIndex--;
  typedEl.textContent = current.slice(0, charIndex);
  if (charIndex === 0) {
    deleting = false;
    titleIndex = (titleIndex + 1) % titles.length;
    return setTimeout(typeLoop, PAUSE_BEFORE);
  }
  setTimeout(typeLoop, DELETE_SPEED);
}

/* people who prefer reduced motion just see the first title, no animation */
if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  typedEl.textContent = titles[0];
} else {
  typeLoop();
}


/* ============ HERO: PROFILE PHOTO FALLBACK ============ */
const profileImg = document.getElementById("profileImg");
const photoFrame = profileImg.closest(".photo-frame");

function showFallback() {
  photoFrame.classList.add("no-photo");
}
profileImg.addEventListener("error", showFallback);
if (profileImg.complete && profileImg.naturalWidth === 0) showFallback();


/* ============ TOAST (pop-up message) ============ */
const toast = document.getElementById("toast");
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}


/* ============ COPY EMAIL ============
   Any element with class "copy-email" and a data-email attribute copies the address
   and shows a message. The message can be changed with data-toast="..." on the element.
   - The hero and footer email icons are plain buttons: they only copy.
   - The Contact section card is also a link that opens Gmail in a new tab:
     the click is not stopped, so it copies AND opens Gmail. */
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // fallback for older browsers
    try {
      const temp = document.createElement("textarea");
      temp.value = text;
      temp.style.position = "fixed";
      temp.style.opacity = "0";
      document.body.appendChild(temp);
      temp.select();
      const ok = document.execCommand("copy");
      temp.remove();
      return ok;
    } catch (e) {
      return false;
    }
  }
}

document.querySelectorAll(".copy-email").forEach((link) => {
  link.addEventListener("click", async () => {
    const email = link.dataset.email;
    const copied = await copyText(email);
    showToast(copied ? (link.dataset.toast || `Email copied: ${email}`) : `My email: ${email}`);
  });
});


/* ============ MODALS: SHARED OPEN / CLOSE ============
   Used by every pop-up. Pop-ups can stack (the screenshot viewer opens
   on top of the project pop-up), so open ones are kept in a list. */
const modalStack = [];

function openModal(modal) {
  modal._opener = document.activeElement;   // so focus can go back there on close
  modalStack.push(modal);
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  modal.querySelector(".modal-box").scrollTop = 0;
  modal.querySelector(".modal-close").focus();
}

function closeModal(modal) {
  const i = modalStack.indexOf(modal);
  if (i === -1) return;
  modalStack.splice(i, 1);
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  if (modalStack.length === 0) document.body.classList.remove("modal-open");
  if (modal._opener) modal._opener.focus();
}

/* close with the X button or by clicking the dark background */
document.querySelectorAll(".modal").forEach((modal) => {
  modal.querySelector(".modal-close").addEventListener("click", () => closeModal(modal));
  modal.querySelector(".modal-backdrop").addEventListener("click", () => closeModal(modal));
});

document.addEventListener("keydown", (e) => {
  const top = modalStack[modalStack.length - 1];
  if (!top) return;

  /* Escape closes only the pop-up on top */
  if (e.key === "Escape") {
    closeModal(top);
    return;
  }

  /* arrow keys move through screenshots */
  if (top === shotModal) {
    if (e.key === "ArrowLeft") { stepShot(-1); return; }
    if (e.key === "ArrowRight") { stepShot(1); return; }
  }

  /* arrow keys switch between certificate and transcript */
  if (top === certModal) {
    if (e.key === "ArrowLeft") { stepCertImage(-1); return; }
    if (e.key === "ArrowRight") { stepCertImage(1); return; }
  }

  /* keep keyboard focus inside the pop-up while it is open */
  if (e.key === "Tab") {
    const focusable = [...top.querySelectorAll("button, a[href]")].filter(
      (node) => node.getClientRects().length > 0 && !node.disabled && node.tabIndex !== -1
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});


/* ============ EDUCATION CERTIFICATE MODAL: DETAILS TEXT ============
   Edit the written details shown in the pop-up here.
   (The certificate IMAGE file names are edited in index.html,
   on each "View Certificate" button: data-src and data-alt.) */
const certData = {
  al: {
    school: "Pushpadana Girls’ College, Kandy, Sri Lanka",
    title: "GCE Advanced Level (A/L), Technology stream",
    period: "Jul 2020 – Oct 2023",
    status: "Completed GCE A/L",
    activities: "Pushpadana Media unit",
    description: [
      "Completed GCE Advanced Level examinations according to the Government syllabus.",
      "Developed a strong foundation in analytical thinking and discipline while participating in school activities.",
    ],
    stats: [
      { label: "Z-Score", value: "2.1253" },
      { label: "District rank", value: "18" },
      { label: "Island rank", value: "303" },
    ],
    subjects: [
      { name: "Science for Technology", grade: "A" },
      { name: "Engineering Technology", grade: "B" },
      { name: "Information and Communication Technology", grade: "B" },
    ],
  },

  ol: {
    school: "Good Shepherd Convent, Kandy, Sri Lanka",
    title: "GCE Ordinary Level (O/L), General Studies",
    period: "Jan 2009 – Jul 2020",
    status: "Completed GCE O/L",
    activities: "",
    description: [
      "Attended Good Shepherd Convent for 11 years, completing both primary and secondary education. Successfully sat for the GCE Ordinary Level (O/L) examinations in 2019 according to the Government syllabus.",
      "This period provided a strong foundation in academic discipline, teamwork and bilingual communication.",
    ],
    stats: [],
    subjectsTitle: "Results",
    subjects: [
      { name: "Catholicism", grade: "A" },
      { name: "Sinhala", grade: "A" },
      { name: "Mathematics", grade: "A" },
      { name: "English", grade: "A" },
      { name: "History", grade: "A" },
      { name: "ICT", grade: "A" },
      { name: "Sinhala Literature", grade: "A" },
      { name: "Science", grade: "B" },
      { name: "French", grade: "C" },
    ],
  },

  esoft: {
    school: "ESOFT Metro Campus, Sri Lanka",
    title: "Diploma in Information Technology (DiTEC)",
    period: "Jan 2020 – Oct 2020",
    status: "Completed Pearson Assured Diploma",
    activities: "",
    description: [
      "Successfully completed the Assured Diploma in Information Technology (DiTEC), a comprehensive 1200 hour program. The course provided in-depth theoretical and practical knowledge across various IT domains.",
    ],
    stats: [
      { label: "Programme hours", value: "1200" },
      { label: "Modules", value: "10" },
    ],
    subjectsTitle: "Key modules completed",
    subjects: [
      { name: "IT Fundamentals", grade: "B" },
      { name: "Working with MS Office", grade: "B" },
      { name: "Computer Hardware", grade: "A+" },
      { name: "Network Technology", grade: "A" },
      { name: "Internet, Email and Web Designing", grade: "A" },
      { name: "Graphics and Multimedia", grade: "B" },
      { name: "Software Engineering", grade: "A" },
      { name: "Python Programming", grade: "A" },
      { name: "Database Concepts", grade: "B" },
      { name: "Programming with C#", grade: "C" },
    ],
  },
};


/* ============ EDUCATION CERTIFICATE MODAL: LOGIC ============ */
const certModal = document.getElementById("certModal");
const certModalImg = document.getElementById("certModalImg");
const certModalMissing = document.getElementById("certModalMissing");

const certSchool = document.getElementById("certSchool");
const certTitle = document.getElementById("certModalTitle");
const certPeriod = document.getElementById("certPeriod");
const certStatus = document.getElementById("certStatus");
const certActivitiesWrap = document.getElementById("certActivitiesWrap");
const certActivities = document.getElementById("certActivities");
const certDesc = document.getElementById("certDesc");
const certStatsWrap = document.getElementById("certStatsWrap");
const certStats = document.getElementById("certStats");
const certSubjectsWrap = document.getElementById("certSubjectsWrap");
const certSubjects = document.getElementById("certSubjects");
const certSubjectsTitle = document.getElementById("certSubjectsTitle");
const certPrev = document.getElementById("certPrev");
const certNext = document.getElementById("certNext");
const certSwitch = document.getElementById("certSwitch");

let certImages = [];      // the image(s) of the education pop-up that is open
let certImgIndex = 0;
let certBusy = false;

/* tabs under the image (only when there is more than one image) */
function buildCertSwitch() {
  const many = certImages.length > 1;
  certSwitch.hidden = !many;
  certPrev.hidden = !many;
  certNext.hidden = !many;
  certSwitch.replaceChildren(
    ...(many
      ? certImages.map((image, i) => {
          const btn = el("button", "cert-switch-btn", image.label);
          btn.type = "button";
          btn.addEventListener("click", () => changeCertImage(i, i > certImgIndex ? 1 : -1));
          return btn;
        })
      : [])
  );
}

/* shows one image straight away */
function setCertImage(i) {
  certImgIndex = i;
  const image = certImages[i];
  certModalMissing.hidden = true;
  certModalImg.hidden = false;
  certModalImg.alt = image.alt || "";
  certModalImg.src = "";   // reset first so a missing image is re-checked every time
  certModalImg.src = image.src;
  certSwitch.querySelectorAll(".cert-switch-btn").forEach((btn, k) => {
    btn.classList.toggle("active", k === i);
    btn.setAttribute("aria-pressed", String(k === i));
  });
}

/* old image swoops out to one side, the new one swoops in from the other */
function changeCertImage(target, dir) {
  if (certBusy || target === certImgIndex) return;
  certBusy = true;
  certModalImg.style.setProperty("--sx", dir > 0 ? "-80px" : "80px");
  certModalImg.classList.add("fade");
  setTimeout(() => {
    certModalImg.style.transition = "none";
    certModalImg.style.setProperty("--sx", dir > 0 ? "80px" : "-80px");
    setCertImage(target);
    void certModalImg.offsetWidth;   // apply the new start position
    certModalImg.style.transition = "";
    certModalImg.classList.remove("fade");
    certBusy = false;
  }, 220);
}

function stepCertImage(dir) {
  if (certImages.length < 2) return;
  changeCertImage((certImgIndex + dir + certImages.length) % certImages.length, dir);
}

certPrev.addEventListener("click", () => stepCertImage(-1));
certNext.addEventListener("click", () => stepCertImage(1));

function fillCertModal(data, images) {
  /* images (paths, alt texts and labels come from the button in index.html) */
  certImages = images;
  certBusy = false;
  certModalImg.classList.remove("fade");
  buildCertSwitch();
  setCertImage(0);

  /* text details */
  certPeriod.textContent = data.period;
  certSchool.textContent = data.school;
  certTitle.textContent = data.title;
  certStatus.textContent = data.status;

  /* activities (optional) */
  certActivitiesWrap.hidden = !data.activities;
  certActivities.textContent = data.activities || "";

  /* description paragraphs */
  certDesc.replaceChildren(...data.description.map((text) => el("p", "", text)));

  /* result tiles (optional) */
  certStatsWrap.hidden = data.stats.length === 0;
  certStats.replaceChildren(
    ...data.stats.map((s) => {
      const tile = el("div", "cert-stat");
      tile.append(el("span", "cert-stat-value", s.value), el("span", "cert-stat-label", s.label));
      return tile;
    })
  );

  /* subjects and grades (optional) */
  certSubjectsWrap.hidden = data.subjects.length === 0;
  certSubjectsTitle.textContent = data.subjectsTitle || "Subjects";
  certSubjects.replaceChildren(
    ...data.subjects.map((s) => {
      const row = el("li");
      row.append(el("span", "", s.name), el("span", "cert-grade", s.grade));
      return row;
    })
  );
}

function openCertModal(key, images) {
  const data = certData[key];
  if (!data) return;
  fillCertModal(data, images);
  openModal(certModal);
}

/* if the certificate file isn't there yet, show a friendly message instead */
certModalImg.addEventListener("error", () => {
  if (!certModal.classList.contains("open")) return;
  certModalImg.hidden = true;
  certModalMissing.hidden = false;
});

/* every "View ... Certificate" button in the Education section */
document.querySelectorAll(".cert-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const images = [{ src: btn.dataset.src, alt: btn.dataset.alt, label: btn.dataset.label || "Certificate" }];
    if (btn.dataset.src2) {
      images.push({ src: btn.dataset.src2, alt: btn.dataset.alt2, label: btn.dataset.label2 || "Document 2" });
    }
    openCertModal(btn.dataset.cert, images);
  });
});


/* ============ SKILLS: CATEGORY SWITCHING ============
   The skills themselves are written in index.html.
   This code only handles clicking and the swoop animation. */
const skillCats = document.querySelectorAll(".skill-cat");
const skillPanels = document.querySelectorAll(".skill-list");
const skillTitle = document.getElementById("skillStageTitle");

const SWOOP_OUT_MS = 200;   // how long the old skills take to slide away
let shownPanel = null;      // the skill list currently on screen
let targetCategory = null;  // the category the visitor last clicked
let swapTimer;

function getPanel(key) {
  return document.querySelector(`.skill-list[data-panel="${key}"]`);
}

/* stagger: each skill gets a number so it can swoop in just after the previous one */
skillPanels.forEach((panel) => {
  panel.querySelectorAll(".skill-item").forEach((item, i) => item.style.setProperty("--i", i));
});

/* show how many skills each category has */
skillCats.forEach((cat) => {
  const panel = getPanel(cat.dataset.category);
  if (!panel) return;
  const n = panel.querySelectorAll(".skill-item").length;
  cat.querySelector(".cat-count").textContent = `${n} ${n === 1 ? "skill" : "skills"}`;
});

/* if a logo can't be loaded, show a small letter badge instead of a broken image */
document.querySelectorAll(".skill-item img.skill-icon").forEach((img) => {
  img.addEventListener("error", () => {
    const letter = img.closest(".skill-item").textContent.trim().charAt(0);
    img.replaceWith(el("span", "skill-icon skill-icon-fallback", letter));
  });
});

function setActiveCard(key) {
  skillCats.forEach((btn) => {
    const on = btn.dataset.category === key;
    btn.classList.toggle("active", on);
    btn.setAttribute("aria-pressed", String(on));
  });
}

function enterPanel(key) {
  const panel = getPanel(key);
  const card = document.querySelector(`.skill-cat[data-category="${key}"] .cat-name`);

  /* new title swoops in */
  skillTitle.textContent = card.textContent;
  skillTitle.classList.remove("leaving");
  skillTitle.style.animation = "none";
  void skillTitle.offsetWidth;          // restart the animation
  skillTitle.style.animation = "";

  /* showing the list restarts its skill animations */
  panel.hidden = false;
  shownPanel = panel;
}

function selectCategory(key) {
  if (key === targetCategory || !getPanel(key)) return;
  targetCategory = key;
  setActiveCard(key);
  clearTimeout(swapTimer);

  /* first time: nothing to slide away */
  if (!shownPanel) {
    enterPanel(key);
    return;
  }

  /* old skills and title swoop away... */
  shownPanel.classList.add("leaving");
  skillTitle.classList.add("leaving");

  /* ...then the new ones swoop in */
  swapTimer = setTimeout(() => {
    skillPanels.forEach((p) => {
      p.hidden = true;
      p.classList.remove("leaving");
    });
    enterPanel(key);
  }, SWOOP_OUT_MS);
}

skillCats.forEach((cat) => {
  cat.addEventListener("click", () => selectCategory(cat.dataset.category));
});

/* the category that is open when the page loads */
selectCategory("qa");


/* ============ CERTIFICATIONS: CARDS + DETAILS POP-UP ============
   All certification details are written in index.html, on each card.
   This code only reads them and shows the pop-up. */
const credModal = document.getElementById("credModal");
const credImg = document.getElementById("credImg");
const credMissing = document.getElementById("credMissing");
const credTitle = document.getElementById("credTitle");
const credPlaceholder = document.getElementById("credPlaceholder");
const credBadgeWrap = document.getElementById("credBadgeWrap");
const credBadge = document.getElementById("credBadge");
const credBadgeLink = document.getElementById("credBadgeLink");
const credInfo = document.getElementById("credInfo");
const credVerify = document.getElementById("credVerify");
const credNoLink = document.getElementById("credNoLink");
const credNote = document.getElementById("credNote");

/* does this card have a real verification link? */
function cardLink(card) {
  const href = card.querySelector(".cert-verify").getAttribute("href");
  return href && href !== "#" ? href : "";
}

/* adds one "label + value" row to the details list */
function addCredRow(label, valueNode) {
  const row = el("div", "cred-row");
  row.append(el("dt", "", label), valueNode);
  credInfo.append(row);
}

function fillCredModal(card) {
  const d = card.dataset;
  const img = card.querySelector(".cert-img");
  const badge = card.querySelector(".cert-badge");
  const link = cardLink(card);

  /* title and placeholder notice */
  credTitle.textContent = card.querySelector(".cert-title").textContent.trim();
  credPlaceholder.hidden = !card.hasAttribute("data-placeholder");

  /* larger certificate image */
  credMissing.hidden = true;
  credImg.hidden = false;
  credImg.alt = img.alt;
  credImg.src = "";   // reset first so a missing image is re-checked every time
  credImg.src = img.getAttribute("src");

  /* digital badge (only if this card has one) */
  credBadgeWrap.hidden = !badge;
  if (badge) {
    credBadge.src = badge.getAttribute("src");
    credBadge.alt = badge.alt;
    credBadgeLink.hidden = !d.badgeLink;
    if (d.badgeLink) credBadgeLink.href = d.badgeLink;
  }

  /* information rows (empty ones are left out) */
  credInfo.replaceChildren();
  if (d.issuer) addCredRow("Platform / issuing organization", el("dd", "", d.issuer));
  if (d.issued) addCredRow("Issue date", el("dd", "", d.issued));
  if (d.expires) addCredRow("Expiration date", el("dd", "", d.expires));
  if (d.workload) addCredRow("Workload", el("dd", "", d.workload));
  if (d.credentialId) addCredRow("Credential ID", el("dd", "", d.credentialId));

  const skills = (d.skills || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (skills.length) {
    const dd = el("dd");
    const wrap = el("div", "cred-skills");
    skills.forEach((s) => wrap.append(el("span", "cred-chip", s)));
    dd.append(wrap);
    addCredRow("Skills / topics", dd);
  }

  if (link) addCredRow("Verification URL", el("dd", "cred-url", link));

  /* verify button (with its hint), or a note if there is no online link */
  credVerify.hidden = !link;
  if (link) credVerify.href = link;
  credNoLink.hidden = Boolean(link);
  credNote.hidden = !(link && d.verifyNote);
  credNote.textContent = (link && d.verifyNote) || "";
}

/* if the certificate file isn't there yet, show a friendly message instead */
credImg.addEventListener("error", () => {
  if (!credModal.classList.contains("open")) return;
  credImg.hidden = true;
  credMissing.hidden = false;
});

function openCredModal(card) {
  fillCredModal(card);
  openModal(credModal);
}

document.querySelectorAll(".cert-card").forEach((card) => {
  const openBtn = card.querySelector(".cert-card-open");
  const verify = card.querySelector(".cert-verify");
  const thumb = card.querySelector(".cert-thumb");
  const img = thumb.querySelector(".cert-img");
  const badge = thumb.querySelector(".cert-badge");

  /* certificate image missing: show the "image coming soon" panel */
  img.addEventListener("error", () => thumb.classList.add("no-image"));
  if (img.complete && img.naturalWidth === 0 && img.loading !== "lazy") thumb.classList.add("no-image");

  /* badge image missing: leave the badge out */
  if (badge) badge.addEventListener("error", () => badge.remove());

  /* no online verification link: the card link opens the details pop-up instead */
  if (!cardLink(card)) {
    verify.textContent = "View Details →";
    verify.removeAttribute("target");
    verify.removeAttribute("rel");
    verify.addEventListener("click", (e) => {
      e.preventDefault();
      openCredModal(card);
    });
  }

  /* clicking the image or title opens the details pop-up */
  openBtn.addEventListener("click", () => openCredModal(card));
});


/* ============ CERTIFICATIONS: "VIEW MORE" ============
   The first few cards are shown. The number is data-initial on the grid in index.html.
   The rest stay hidden until the visitor clicks the button. */
const certGrid = document.getElementById("certGrid");
const certMore = document.getElementById("certMore");
const certInitial = parseInt(certGrid.dataset.initial, 10) || 6;
const certExtras = [...certGrid.querySelectorAll(".cert-card")].slice(certInitial);
let certExpanded = false;

function setCertExpanded(expanded) {
  certExpanded = expanded;

  certExtras.forEach((card, i) => {
    card.hidden = !expanded;
    card.classList.remove("cert-in");
    if (expanded) {
      card.style.setProperty("--k", i);   // each new card appears slightly after the one before
      void card.offsetWidth;              // restart the animation
      card.classList.add("cert-in");
    }
  });

  const n = certExtras.length;
  certMore.setAttribute("aria-expanded", String(expanded));
  certMore.textContent = expanded
    ? "Show fewer certifications"
    : `View ${n} more certification${n === 1 ? "" : "s"}`;
}

if (certExtras.length === 0) {
  certMore.parentElement.hidden = true;   // nothing extra to show: no button
} else {
  setCertExpanded(false);
  certMore.addEventListener("click", () => {
    const wasExpanded = certExpanded;
    setCertExpanded(!wasExpanded);
    /* after "Show fewer", scroll back to the top of the section so the visitor isn't lost */
    if (wasExpanded) {
      document.getElementById("certifications").scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
}


/* ============ PROJECTS: GALLERY + DETAIL POP-UP ============
   Everything shown about a project is written in index.html, inside that
   project's card. This code only reads it and builds the pop-up. */
const projModal = document.getElementById("projModal");
const projBox = projModal.querySelector(".proj-box");
const pdScroll = document.getElementById("pdScroll");
const pdBody = document.getElementById("pdBody");
const pdNav = projModal.querySelector(".pd-nav");
const pdPrev = document.getElementById("pdPrev");
const pdNext = document.getElementById("pdNext");
const pdPrevName = document.getElementById("pdPrevName");
const pdNextName = document.getElementById("pdNextName");

const projCards = [...document.querySelectorAll(".project-card")];
let currentProject = -1;
let currentShots = [];     // screenshots of the project that is open
let swapping = false;

function projText(card, selector) {
  return card.querySelector(selector).textContent.trim();
}

/* one named part of a project's hidden detail block, e.g. "overview" */
function projPart(card, name) {
  return card.querySelector(`.project-detail [data-part="${name}"]`);
}

function cloneAll(list) {
  return [...list].map((node) => node.cloneNode(true));
}

/* builds everything inside the pop-up for one project */
function buildProject(index) {
  const card = projCards[index];
  const frag = document.createDocumentFragment();
  let order = 0;

  /* each piece fades in slightly after the one before it */
  const reveal = (node) => {
    node.classList.add("pd-reveal");
    node.style.setProperty("--i", order++);
    return node;
  };
  const section = (title, extraClass) => {
    const s = reveal(el("section", "pd-section" + (extraClass ? " " + extraClass : "")));
    s.append(el("h4", "pd-h", title));
    return s;
  };

  /* 1. title */
  const head = reveal(el("header", "pd-head"));
  const title = el("h3", "pd-title", projText(card, ".project-name"));
  title.id = "projTitle";
  head.append(title, el("p", "pd-sub", projText(card, ".project-sub")));
  if (card.hasAttribute("data-placeholder")) {
    head.append(el("span", "cert-tag cert-tag-warn pd-warn", "Placeholder: details to be added"));
  }
  frag.append(head);

  /* 2. large preview image */
  const cover = card.querySelector(".project-media img");
  const hero = reveal(el("figure", "pd-hero"));
  const heroImg = el("img");
  heroImg.src = cover.getAttribute("src");
  heroImg.alt = cover.alt;
  heroImg.decoding = "async";
  heroImg.addEventListener("error", () => hero.classList.add("no-image"));
  hero.append(heroImg, el("div", "pd-hero-fallback", "Project preview coming soon"));
  frag.append(hero);

  /* 3. overview */
  const overview = projPart(card, "overview");
  if (overview && overview.children.length) {
    const s = section("About the project");
    s.append(...cloneAll(overview.children));
    frag.append(s);
  }

  /* 4. key features */
  const features = projPart(card, "features");
  if (features && features.children.length) {
    const s = section("Key features");
    const ul = el("ul", "pd-features");
    ul.append(...cloneAll(features.children));
    s.append(ul);
    frag.append(s);
  }

  /* 5. my contribution (the highlighted part) */
  const contribution = projPart(card, "contribution");
  if (contribution && contribution.children.length) {
    const s = section("My contribution", "pd-contrib");
    const grid = el("div", "pc-grid");
    grid.append(...cloneAll(contribution.children));
    s.append(grid);
    frag.append(s);
  }

  /* 6. technologies */
  const tech = projPart(card, "tech");
  if (tech && tech.children.length) {
    const s = section("Technologies");
    const ul = el("ul", "pd-tech");
    ul.append(...cloneAll(tech.children));
    s.append(ul);
    frag.append(s);
  }

  /* 7. screenshots */
  currentShots = [];
  const shotList = projPart(card, "screenshots");
  if (shotList) {
    shotList.querySelectorAll("img").forEach((img) => {
      currentShots.push({ src: img.getAttribute("src"), alt: img.alt });
    });
  }
  if (currentShots.length) {
    const s = section("Project screenshots");
    const wrap = el("div", "pd-shots");

    currentShots.forEach((shot, i) => {
      const btn = el("button", "pd-shot");
      btn.type = "button";
      btn.setAttribute("aria-label", `Open screenshot ${i + 1} of ${currentShots.length}`);

      const img = el("img");
      img.src = shot.src;
      img.alt = shot.alt;
      img.loading = "lazy";
      img.decoding = "async";
      img.addEventListener("error", () => btn.classList.add("no-image"));

      btn.append(img, el("span", "pd-shot-fallback", "Coming soon"));
      btn.addEventListener("click", () => openShots(i));
      wrap.append(btn);
    });

    s.append(wrap);
    frag.append(s);
  }

  /* 8. buttons: links (GitHub, demo) and View Screenshots */
  const actions = reveal(el("div", "pd-actions"));
  let hasAction = false;

  const links = projPart(card, "links");
  if (links) {
    links.querySelectorAll("a").forEach((a) => {
      const href = a.getAttribute("href");
      if (!href || href === "#") return;   // no real link yet: skip it

      const isGithub = a.dataset.icon === "github";
      const btn = el("a", "btn " + (hasAction ? "btn-outline" : "btn-primary"));
      btn.href = href;
      btn.target = "_blank";
      btn.rel = "noopener noreferrer";
      btn.append(
        icon(isGithub ? "i-github" : "i-external", isGithub ? "fill" : ""),
        document.createTextNode(a.textContent.trim() + " →")
      );
      actions.append(btn);
      hasAction = true;
    });
  }

  if (currentShots.length) {
    const btn = el("button", "btn btn-outline");
    btn.type = "button";
    btn.append(icon("i-image"), document.createTextNode("View Screenshots"));
    btn.addEventListener("click", () => openShots(0));
    actions.append(btn);
    hasAction = true;
  }
  if (hasAction) frag.append(actions);

  return frag;
}

/* puts a project into the pop-up and updates the Previous / Next buttons */
function renderProject(index) {
  currentProject = index;
  pdBody.replaceChildren(buildProject(index));
  pdScroll.scrollTop = 0;

  const n = projCards.length;
  pdNav.hidden = n < 2;
  pdPrevName.textContent = projText(projCards[(index - 1 + n) % n], ".project-name");
  pdNextName.textContent = projText(projCards[(index + 1) % n], ".project-name");
}

function openProject(index, originCard) {
  /* the pop-up grows out of the card that was clicked */
  const r = originCard.getBoundingClientRect();
  projBox.style.setProperty("--ox", `${(((r.left + r.width / 2) / window.innerWidth) * 100).toFixed(1)}%`);
  projBox.style.setProperty("--oy", `${(((r.top + r.height / 2) / window.innerHeight) * 100).toFixed(1)}%`);

  pdBody.style.setProperty("--dx", "0px");
  renderProject(index);
  openModal(projModal);
}

/* Previous / Next: current project slides out, the next one slides in */
function swapProject(step) {
  if (swapping) return;
  swapping = true;

  const n = projCards.length;
  const next = (currentProject + step + n) % n;

  pdBody.style.setProperty("--out", step > 0 ? "-30px" : "30px");
  pdBody.classList.add("leaving");

  setTimeout(() => {
    pdBody.style.setProperty("--dx", step > 0 ? "40px" : "-40px");
    renderProject(next);
    pdBody.classList.remove("leaving");
    swapping = false;
  }, 190);
}

pdPrev.addEventListener("click", () => swapProject(-1));
pdNext.addEventListener("click", () => swapProject(1));

/* every project card: open on click, and handle a missing cover image */
projCards.forEach((card, i) => {
  const media = card.querySelector(".project-media");
  const img = media.querySelector("img");

  img.addEventListener("error", () => media.classList.add("no-image"));
  if (img.complete && img.naturalWidth === 0 && img.loading !== "lazy") media.classList.add("no-image");

  card.querySelector(".project-open").addEventListener("click", () => openProject(i, card));
});


/* ============ PROJECTS: SCREENSHOT VIEWER ============ */
const shotModal = document.getElementById("shotModal");
const shotStage = document.getElementById("shotStage");
const shotImg = document.getElementById("shotImg");
const shotMissing = document.getElementById("shotMissing");
const shotCaption = document.getElementById("shotCaption");
const shotCount = document.getElementById("shotCount");
const shotThumbs = document.getElementById("shotThumbs");
const shotPrev = document.getElementById("shotPrev");
const shotNext = document.getElementById("shotNext");

let shotIndex = 0;
let shotBusy = false;

function buildThumbs() {
  shotThumbs.replaceChildren(
    ...currentShots.map((shot, i) => {
      const btn = el("button", "shot-thumb");
      btn.type = "button";
      btn.setAttribute("aria-label", `Show screenshot ${i + 1}`);

      const img = el("img");
      img.src = shot.src;
      img.alt = "";
      img.loading = "lazy";
      img.addEventListener("error", () => img.remove());

      btn.append(img);
      btn.addEventListener("click", () => {
        if (i !== shotIndex) changeShot(i, i > shotIndex ? 1 : -1);
      });
      return btn;
    })
  );
}

/* shows one screenshot straight away */
function setShot(i) {
  shotIndex = (i + currentShots.length) % currentShots.length;
  const shot = currentShots[shotIndex];

  shotMissing.hidden = true;
  shotImg.hidden = false;
  shotImg.alt = shot.alt;
  shotImg.src = shot.src;

  shotCount.textContent = `${shotIndex + 1} / ${currentShots.length}`;
  shotThumbs.querySelectorAll(".shot-thumb").forEach((thumb, k) => {
    thumb.classList.toggle("active", k === shotIndex);
    if (k === shotIndex) thumb.setAttribute("aria-current", "true");
    else thumb.removeAttribute("aria-current");
  });
}

/* fades the old screenshot out, then the new one in */
function changeShot(target, dir) {
  if (shotBusy || target === shotIndex) return;
  shotBusy = true;
  shotImg.style.setProperty("--sx", dir > 0 ? "-30px" : "30px");
  shotImg.classList.add("fade");
  setTimeout(() => {
    setShot(target);
    shotImg.classList.remove("fade");
    shotBusy = false;
  }, 150);
}

function stepShot(dir) {
  if (currentShots.length < 2) return;
  changeShot((shotIndex + dir + currentShots.length) % currentShots.length, dir);
}

function openShots(i) {
  const many = currentShots.length > 1;
  shotPrev.hidden = !many;
  shotNext.hidden = !many;
  shotCount.hidden = !many;
  shotThumbs.hidden = !many;

  shotCaption.textContent = projText(projCards[currentProject], ".project-name") + " · Screenshots";
  buildThumbs();
  setShot(i);
  openModal(shotModal);
}

/* if the screenshot file isn't there yet, show a friendly message instead */
shotImg.addEventListener("error", () => {
  if (!shotModal.classList.contains("open")) return;
  shotImg.hidden = true;
  shotMissing.hidden = false;
});

shotPrev.addEventListener("click", () => stepShot(-1));
shotNext.addEventListener("click", () => stepShot(1));

/* swipe left / right on touch screens */
let touchStartX = null;
shotStage.addEventListener("touchstart", (e) => {
  touchStartX = e.changedTouches[0].clientX;
}, { passive: true });
shotStage.addEventListener("touchend", (e) => {
  if (touchStartX === null) return;
  const dx = e.changedTouches[0].clientX - touchStartX;
  touchStartX = null;
  if (Math.abs(dx) > 50) stepShot(dx < 0 ? 1 : -1);
}, { passive: true });


/* ============ CONTACT FORM ============
   The address the message is sent to is set in index.html: data-endpoint on the <form>.
   - data-endpoint filled in (the Formspree address): the message is sent from the page.
   - data-endpoint empty: Gmail opens in a new tab with the message already written. */
const contactForm = document.getElementById("contactForm");
const cfSubmit = document.getElementById("cfSubmit");
const formStatus = document.getElementById("formStatus");

const formFields = [
  {
    input: document.getElementById("cfName"),
    error: document.getElementById("cfNameError"),
    check: (value) => (value.trim().length < 2 ? "Please enter your name." : ""),
  },
  {
    input: document.getElementById("cfEmail"),
    error: document.getElementById("cfEmailError"),
    check: (value, input) => {
      if (!value.trim()) return "Please enter your email address.";
      return input.validity.valid ? "" : "Please enter a valid email address.";
    },
  },
  {
    input: document.getElementById("cfMessage"),
    error: document.getElementById("cfMessageError"),
    /* no minimum length: the message only has to be filled in */
    check: (value) => (value.trim().length < 1 ? "Please write a message." : ""),
  },
];

function setFormStatus(type, message) {
  formStatus.className = "form-status" + (type ? " " + type : "");
  formStatus.textContent = message;
  formStatus.hidden = !message;
}

/* checks one field and shows or clears its message; returns true when it is fine */
function validateField(field) {
  const message = field.check(field.input.value, field.input);
  field.error.textContent = message;
  field.error.hidden = !message;
  field.input.setAttribute("aria-invalid", String(Boolean(message)));
  field.input.closest(".field").classList.toggle("invalid", Boolean(message));
  return !message;
}

formFields.forEach((field) => {
  field.input.addEventListener("blur", () => validateField(field));
  /* once a field has an error, clear it as soon as it is fixed */
  field.input.addEventListener("input", () => {
    if (field.input.closest(".field").classList.contains("invalid")) validateField(field);
  });
});

contactForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  setFormStatus("", "");

  /* the hidden spam-trap field is filled: it is a bot, so do nothing */
  if (contactForm.elements._gotcha.value) return;

  /* check every field; focus the first one that needs fixing */
  const results = formFields.map((field) => validateField(field));
  if (results.includes(false)) {
    formFields[results.indexOf(false)].input.focus();
    return;
  }

  const name = formFields[0].input.value.trim();
  const email = formFields[1].input.value.trim();
  const message = formFields[2].input.value.trim();
  const endpoint = (contactForm.dataset.endpoint || "").trim();
  const fallbackEmail = contactForm.dataset.fallbackEmail;

  /* no form service set up: open Gmail in a new tab with the message ready to send */
  if (!endpoint) {
    const subject = encodeURIComponent(`Portfolio message from ${name}`);
    const body = encodeURIComponent(`${message}\n\nFrom: ${name} (${email})`);
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(fallbackEmail)}&su=${subject}&body=${body}`;
    window.open(gmailUrl, "_blank", "noopener");
    setFormStatus(
      "info",
      `Gmail should open in a new tab with your message ready to send. If it doesn't, copy my email address (${fallbackEmail}) and write to me directly.`
    );
    return;
  }

  /* send the message through the form service */
  cfSubmit.disabled = true;
  cfSubmit.textContent = "Sending…";

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ name, email, message }),
    });

    if (response.ok) {
      contactForm.reset();
      formFields.forEach((field) => {
        field.error.hidden = true;
        field.input.removeAttribute("aria-invalid");
        field.input.closest(".field").classList.remove("invalid");
      });
      setFormStatus("success", "Thank you! Your message has been sent. I'll get back to you soon.");
    } else {
      setFormStatus("error", `Sorry, your message could not be sent. Please try again, or email me at ${fallbackEmail}.`);
    }
  } catch (err) {
    setFormStatus("error", `Sorry, something went wrong. Please check your connection and try again, or email me at ${fallbackEmail}.`);
  } finally {
    cfSubmit.disabled = false;
    cfSubmit.textContent = "Send Message";
  }
});


/* ============ SCROLL REVEAL ============
   Anything with class "reveal" fades in and moves up when it scrolls into view.
   The delay (style="--d:...") makes the heading, subtitle and cards appear one after another. */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
);
document.querySelectorAll(".reveal").forEach((node) => revealObserver.observe(node));