const storageKey = "youooo_resume_v1";

const formEls = {
  fullName: document.getElementById("fullName"),
  jobTitle: document.getElementById("jobTitle"),
  email: document.getElementById("email"),
  phone: document.getElementById("phone"),
  location: document.getElementById("location"),
  website: document.getElementById("website"),
  summary: document.getElementById("summary"),
  skills: document.getElementById("skills"),
  projects: document.getElementById("projects"),
};

const previewEls = {
  name: document.getElementById("previewName"),
  title: document.getElementById("previewTitle"),
  contact: document.getElementById("previewContact"),
  summary: document.getElementById("previewSummary"),
  skills: document.getElementById("previewSkills"),
  experience: document.getElementById("previewExperience"),
  education: document.getElementById("previewEducation"),
  projects: document.getElementById("previewProjects"),
  paper: document.getElementById("resumePreview"),
};

const experienceList = document.getElementById("experienceList");
const educationList = document.getElementById("educationList");
const expTemplate = document.getElementById("experienceTemplate");
const eduTemplate = document.getElementById("educationTemplate");

const saveBtn = document.getElementById("saveBtn");
const clearBtn = document.getElementById("clearBtn");
const printBtn = document.getElementById("printBtn");
const addExperienceBtn = document.getElementById("addExperienceBtn");
const addEducationBtn = document.getElementById("addEducationBtn");
const loadDemoBtn = document.getElementById("loadDemoBtn");
const templateButtons = document.querySelectorAll(".template-btn");

let currentTemplate = "modern";

function createExperienceItem(data = {}) {
  const node = expTemplate.content.firstElementChild.cloneNode(true);

  node.querySelector(".exp-role").value = data.role || "";
  node.querySelector(".exp-company").value = data.company || "";
  node.querySelector(".exp-start").value = data.start || "";
  node.querySelector(".exp-end").value = data.end || "";
  node.querySelector(".exp-desc").value = data.desc || "";

  node.querySelector(".remove-btn").addEventListener("click", () => {
    node.remove();
    updatePreview();
  });

  node.querySelectorAll("input, textarea").forEach((el) => {
    el.addEventListener("input", updatePreview);
  });

  experienceList.appendChild(node);
}

function createEducationItem(data = {}) {
  const node = eduTemplate.content.firstElementChild.cloneNode(true);

  node.querySelector(".edu-degree").value = data.degree || "";
  node.querySelector(".edu-school").value = data.school || "";
  node.querySelector(".edu-start").value = data.start || "";
  node.querySelector(".edu-end").value = data.end || "";
  node.querySelector(".edu-notes").value = data.notes || "";

  node.querySelector(".remove-btn").addEventListener("click", () => {
    node.remove();
    updatePreview();
  });

  node.querySelectorAll("input").forEach((el) => {
    el.addEventListener("input", updatePreview);
  });

  educationList.appendChild(node);
}

function getExperienceData() {
  return [...experienceList.querySelectorAll(".experience-item")].map((item) => ({
    role: item.querySelector(".exp-role").value.trim(),
    company: item.querySelector(".exp-company").value.trim(),
    start: item.querySelector(".exp-start").value.trim(),
    end: item.querySelector(".exp-end").value.trim(),
    desc: item.querySelector(".exp-desc").value.trim(),
  }));
}

function getEducationData() {
  return [...educationList.querySelectorAll(".education-item")].map((item) => ({
    degree: item.querySelector(".edu-degree").value.trim(),
    school: item.querySelector(".edu-school").value.trim(),
    start: item.querySelector(".edu-start").value.trim(),
    end: item.querySelector(".edu-end").value.trim(),
    notes: item.querySelector(".edu-notes").value.trim(),
  }));
}

function getFormData() {
  return {
    fullName: formEls.fullName.value.trim(),
    jobTitle: formEls.jobTitle.value.trim(),
    email: formEls.email.value.trim(),
    phone: formEls.phone.value.trim(),
    location: formEls.location.value.trim(),
    website: formEls.website.value.trim(),
    summary: formEls.summary.value.trim(),
    skills: formEls.skills.value.trim(),
    projects: formEls.projects.value.trim(),
    template: currentTemplate,
    experience: getExperienceData(),
    education: getEducationData(),
  };
}

function updateContact(data) {
  const pieces = [data.email, data.phone, data.location, data.website].filter(Boolean);
  previewEls.contact.innerHTML = pieces.length
    ? pieces.map((p) => `<span>${escapeHtml(p)}</span>`).join("")
    : "<span>email@example.com</span><span>+1 555 555 5555</span><span>City, State</span><span>linkedin.com/in/yourname</span>";
}

function updateSkills(skillsString) {
  const items = skillsString
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!items.length) {
    previewEls.skills.innerHTML = `
      <span class="skill-tag">Communication</span>
      <span class="skill-tag">Leadership</span>
      <span class="skill-tag">Technical Skills</span>
    `;
    return;
  }

  previewEls.skills.innerHTML = items
    .map((skill) => `<span class="skill-tag">${escapeHtml(skill)}</span>`)
    .join("");
}

function updateExperience(items) {
  if (!items.length || items.every((x) => !x.role && !x.company && !x.desc)) {
    previewEls.experience.innerHTML = `
      <div class="entry">
        <div class="entry-head">
          <div>
            <div class="entry-title">Job Title</div>
            <div class="entry-sub">Company Name</div>
          </div>
          <div class="entry-date">Start - End</div>
        </div>
        <p class="entry-desc">Your work experience will appear here.</p>
      </div>
    `;
    return;
  }

  previewEls.experience.innerHTML = items
    .filter((item) => item.role || item.company || item.desc)
    .map((item) => {
      const dateText = [item.start, item.end].filter(Boolean).join(" - ");
      return `
        <div class="entry">
          <div class="entry-head">
            <div>
              <div class="entry-title">${escapeHtml(item.role || "Role")}</div>
              <div class="entry-sub">${escapeHtml(item.company || "Company")}</div>
            </div>
            <div class="entry-date">${escapeHtml(dateText || "Dates")}</div>
          </div>
          <p class="entry-desc">${escapeHtml(item.desc || "")}</p>
        </div>
      `;
    })
    .join("");
}

function updateEducation(items) {
  if (!items.length || items.every((x) => !x.degree && !x.school && !x.notes)) {
    previewEls.education.innerHTML = `
      <div class="entry">
        <div class="entry-head">
          <div>
            <div class="entry-title">Degree / Program</div>
            <div class="entry-sub">School Name</div>
          </div>
          <div class="entry-date">Year - Year</div>
        </div>
        <p class="entry-desc">Your education will appear here.</p>
      </div>
    `;
    return;
  }

  previewEls.education.innerHTML = items
    .filter((item) => item.degree || item.school || item.notes)
    .map((item) => {
      const dateText = [item.start, item.end].filter(Boolean).join(" - ");
      return `
        <div class="entry">
          <div class="entry-head">
            <div>
              <div class="entry-title">${escapeHtml(item.degree || "Degree")}</div>
              <div class="entry-sub">${escapeHtml(item.school || "School")}</div>
            </div>
            <div class="entry-date">${escapeHtml(dateText || "Dates")}</div>
          </div>
          <p class="entry-desc">${escapeHtml(item.notes || "")}</p>
        </div>
      `;
    })
    .join("");
}

function updateProjects(projectText) {
  const lines = projectText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    previewEls.projects.innerHTML = "<li>Your projects and achievements will appear here.</li>";
    return;
  }

  previewEls.projects.innerHTML = lines
    .map((line) => `<li>${escapeHtml(line)}</li>`)
    .join("");
}

function applyTemplate(template) {
  currentTemplate = template;
  previewEls.paper.classList.remove("modern", "classic", "minimal");
  previewEls.paper.classList.add(template);

  templateButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.template === template);
  });
}

function updatePreview() {
  const data = getFormData();

  previewEls.name.textContent = data.fullName || "Your Name";
  previewEls.title.textContent = data.jobTitle || "Professional Title";
  previewEls.summary.textContent =
    data.summary || "A clear, results-driven professional summary will appear here.";

  updateContact(data);
  updateSkills(data.skills);
  updateExperience(data.experience);
  updateEducation(data.education);
  updateProjects(data.projects);
  applyTemplate(data.template);
}

function saveToLocal() {
  const data = getFormData();
  localStorage.setItem(storageKey, JSON.stringify(data));
  saveBtn.textContent = "Saved";
  setTimeout(() => {
    saveBtn.textContent = "Save Progress";
  }, 1200);
}

function loadFromLocal() {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return false;

  try {
    const data = JSON.parse(raw);

    formEls.fullName.value = data.fullName || "";
    formEls.jobTitle.value = data.jobTitle || "";
    formEls.email.value = data.email || "";
    formEls.phone.value = data.phone || "";
    formEls.location.value = data.location || "";
    formEls.website.value = data.website || "";
    formEls.summary.value = data.summary || "";
    formEls.skills.value = data.skills || "";
    formEls.projects.value = data.projects || "";

    experienceList.innerHTML = "";
    educationList.innerHTML = "";

    (data.experience || []).forEach((item) => createExperienceItem(item));
    (data.education || []).forEach((item) => createEducationItem(item));

    if (!(data.experience || []).length) createExperienceItem();
    if (!(data.education || []).length) createEducationItem();

    applyTemplate(data.template || "modern");
    updatePreview();
    return true;
  } catch (err) {
    console.error("Failed to load saved resume:", err);
    return false;
  }
}

function clearAll() {
  if (!confirm("Clear all resume data?")) return;

  localStorage.removeItem(storageKey);

  Object.values(formEls).forEach((el) => {
    el.value = "";
  });

  experienceList.innerHTML = "";
  educationList.innerHTML = "";
  createExperienceItem();
  createEducationItem();
  applyTemplate("modern");
  updatePreview();
}

function loadDemoResume() {
  const demo = {
    fullName: "Alex Carter",
    jobTitle: "Cloud & Infrastructure Engineer",
    email: "alex.carter@email.com",
    phone: "+1 512 555 0183",
    location: "Austin, TX",
    website: "linkedin.com/in/alexcarter",
    summary:
      "Results-driven engineer with experience in cloud infrastructure, Linux systems, automation, and validation. Skilled at troubleshooting complex environments, improving reliability, and supporting cross-functional technical teams.",
    skills: "AWS, Linux, Python, Terraform, Docker, CI/CD, Networking, Validation, Troubleshooting, SQL",
    projects:
      "Built a cloud-based deployment pipeline for internal services\nCreated an automated health-check dashboard for infrastructure monitoring\nImproved validation workflow documentation and debug turnaround time",
    template: "modern",
    experience: [
      {
        role: "Infrastructure Engineer",
        company: "Tech Systems Inc.",
        start: "2023",
        end: "Present",
        desc:
          "Managed Linux-based infrastructure and cloud resources.\nAutomated deployment and monitoring tasks.\nWorked across engineering teams to improve reliability and support production readiness."
      },
      {
        role: "Systems Support Engineer",
        company: "NextWave Solutions",
        start: "2021",
        end: "2023",
        desc:
          "Provided technical troubleshooting for internal platforms.\nDocumented recurring issues and standardized support workflows.\nHelped optimize system performance and incident response."
      }
    ],
    education: [
      {
        degree: "B.S. in Information Technology",
        school: "State University",
        start: "2017",
        end: "2021",
        notes: "Focused on cloud systems, networking, and automation"
      }
    ]
  };

  formEls.fullName.value = demo.fullName;
  formEls.jobTitle.value = demo.jobTitle;
  formEls.email.value = demo.email;
  formEls.phone.value = demo.phone;
  formEls.location.value = demo.location;
  formEls.website.value = demo.website;
  formEls.summary.value = demo.summary;
  formEls.skills.value = demo.skills;
  formEls.projects.value = demo.projects;

  experienceList.innerHTML = "";
  educationList.innerHTML = "";

  demo.experience.forEach((item) => createExperienceItem(item));
  demo.education.forEach((item) => createEducationItem(item));

  applyTemplate(demo.template);
  updatePreview();
  saveToLocal();

  document.getElementById("builder").scrollIntoView({ behavior: "smooth" });
}

function escapeHtml(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

Object.values(formEls).forEach((el) => {
  el.addEventListener("input", updatePreview);
});

templateButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    applyTemplate(btn.dataset.template);
    updatePreview();
  });
});

addExperienceBtn.addEventListener("click", () => {
  createExperienceItem();
  updatePreview();
});

addEducationBtn.addEventListener("click", () => {
  createEducationItem();
  updatePreview();
});

saveBtn.addEventListener("click", saveToLocal);
clearBtn.addEventListener("click", clearAll);
printBtn.addEventListener("click", () => window.print());
loadDemoBtn.addEventListener("click", loadDemoResume);

if (!loadFromLocal()) {
  createExperienceItem();
  createEducationItem();
  applyTemplate("modern");
  updatePreview();
}
