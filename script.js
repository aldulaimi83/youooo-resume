// ============================================================
// AI ENGINE — Google Gemini Free API
// ============================================================

const AI_KEY_STORAGE = 'youooo_gemini_key';

function getAiKey() {
  return localStorage.getItem(AI_KEY_STORAGE) || '';
}

function setAiKey(key) {
  if (key) {
    localStorage.setItem(AI_KEY_STORAGE, key.trim());
  } else {
    localStorage.removeItem(AI_KEY_STORAGE);
  }
}

function hasAiKey() {
  return !!getAiKey();
}

function updateAiKeyDot() {
  const dot = document.getElementById('aiKeyDot');
  if (!dot) return;
  dot.className = 'key-dot ' + (hasAiKey() ? 'on' : 'off');
}

function openAiModal() {
  const modal = document.getElementById('aiModal');
  if (modal) {
    modal.classList.remove('hidden');
    const input = document.getElementById('aiKeyInput');
    if (input) input.value = getAiKey();
    updateAiKeyDot();
  }
}

function closeAiModal() {
  const modal = document.getElementById('aiModal');
  if (modal) modal.classList.add('hidden');
}

function showAiHint() {
  const toast = document.getElementById('aiHintToast');
  if (!toast) return;
  toast.classList.remove('hidden');
  toast.classList.add('visible');
  clearTimeout(window._aiHintTimer);
  window._aiHintTimer = setTimeout(() => {
    toast.classList.remove('visible');
  }, 4000);
}

async function callGemini(prompt) {
  const key = getAiKey();
  if (!key) {
    openAiModal();
    throw new Error('No API key');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024
        }
      })
    }
  );

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const msg = errData.error?.message || `API error (${response.status})`;
    throw new Error(msg);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
}

async function withAiLoading(btn, fn) {
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="ai-spin">⏳</span> AI writing...';
  try {
    await fn();
  } catch (err) {
    if (err.message !== 'No API key') {
      alert('AI Error: ' + err.message);
    }
  } finally {
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}

// ============================================================
// DOM REFERENCES
// ============================================================

const storageKey = 'youooo_resume_v2';

const formEls = {
  fullName: document.getElementById('fullName'),
  jobTitle: document.getElementById('jobTitle'),
  email: document.getElementById('email'),
  phone: document.getElementById('phone'),
  location: document.getElementById('location'),
  website: document.getElementById('website'),
  summary: document.getElementById('summary'),
  skills: document.getElementById('skills'),
  projects: document.getElementById('projects'),
  jobDescription: document.getElementById('jobDescription')
};

const previewEls = {
  name: document.getElementById('previewName'),
  title: document.getElementById('previewTitle'),
  contact: document.getElementById('previewContact'),
  summary: document.getElementById('previewSummary'),
  skills: document.getElementById('previewSkills'),
  experience: document.getElementById('previewExperience'),
  education: document.getElementById('previewEducation'),
  projects: document.getElementById('previewProjects'),
  paper: document.getElementById('resumePreview')
};

const scoreEls = {
  resumeScore: document.getElementById('resumeScore'),
  resumeScoreFill: document.getElementById('resumeScoreFill'),
  completenessScore: document.getElementById('completenessScore'),
  impactScore: document.getElementById('impactScore'),
  matchScore: document.getElementById('matchScore'),
  matchBadge: document.getElementById('matchBadge'),
  jdMatchFill: document.getElementById('jdMatchFill'),
  matchedKeywords: document.getElementById('matchedKeywords'),
  missingKeywords: document.getElementById('missingKeywords'),
  matchSuggestions: document.getElementById('matchSuggestions')
};

const experienceList = document.getElementById('experienceList');
const educationList = document.getElementById('educationList');
const expTemplate = document.getElementById('experienceTemplate');
const eduTemplate = document.getElementById('educationTemplate');

const saveBtn = document.getElementById('saveBtn');
const clearBtn = document.getElementById('clearBtn');
const printBtn = document.getElementById('printBtn');
const addExperienceBtn = document.getElementById('addExperienceBtn');
const addEducationBtn = document.getElementById('addEducationBtn');
const loadDemoBtn = document.getElementById('loadDemoBtn');
const loadDemoJdBtn = document.getElementById('loadDemoJdBtn');
const analyzeMatchBtn = document.getElementById('analyzeMatchBtn');
const improveSummaryBtn = document.getElementById('improveSummaryBtn');
const improveProjectsBtn = document.getElementById('improveProjectsBtn');
const improveAllBulletsBtn = document.getElementById('improveAllBulletsBtn');
const templateButtons = document.querySelectorAll('.template-btn');

let currentTemplate = 'modern';
let currentMatchPercent = 0;

// ============================================================
// KEYWORD LIBRARY
// ============================================================

const keywordLibrary = [
  'aws', 'azure', 'gcp', 'linux', 'windows', 'python', 'java', 'c++', 'c', 'sql',
  'terraform', 'docker', 'kubernetes', 'ci/cd', 'jenkins', 'git', 'github',
  'validation', 'automation', 'debugging', 'troubleshooting', 'testing', 'firmware',
  'hardware', 'embedded', 'api', 'rest', 'networking', 'cloud', 'monitoring',
  'agile', 'scrum', 'jira', 'confluence', 'data analysis', 'excel', 'power bi',
  'machine learning', 'ai', 'security', 'scripting', 'bash', 'shell', 'ansible',
  'incident response', 'devops', 'communication', 'leadership', 'cross-functional',
  'semiconductor', 'memory', 'electrical', 'canalyzer', 'can', 'ota', 'oscilloscope',
  'root cause', 'performance', 'deployment', 'optimization', 'integration', 'qa',
  'project management', 'documentation', 'lab testing', 'systems engineering'
];

const weakLeadIns = [
  'responsible for', 'worked on', 'helped with', 'involved in',
  'tasked with', 'handled', 'did', 'support'
];

const strongVerbs = [
  'Built', 'Improved', 'Validated', 'Automated', 'Reduced', 'Optimized',
  'Delivered', 'Led', 'Implemented', 'Developed', 'Analyzed', 'Resolved',
  'Streamlined', 'Supported'
];

// ============================================================
// EXPERIENCE / EDUCATION ITEMS
// ============================================================

function createExperienceItem(data = {}) {
  const node = expTemplate.content.firstElementChild.cloneNode(true);

  node.querySelector('.exp-role').value = data.role || '';
  node.querySelector('.exp-company').value = data.company || '';
  node.querySelector('.exp-start').value = data.start || '';
  node.querySelector('.exp-end').value = data.end || '';
  node.querySelector('.exp-desc').value = data.desc || '';

  node.querySelector('.remove-btn').addEventListener('click', () => {
    node.remove();
    updatePreview();
  });

  // AI-aware bullet improvement
  node.querySelector('.improve-bullet-btn').addEventListener('click', async function () {
    const btn = this;
    if (hasAiKey()) {
      await withAiLoading(btn, () => aiWriteExpBullets(node));
    } else {
      const area = node.querySelector('.exp-desc');
      area.value = improveBulletBlock(area.value, getResumeContext());
      updatePreview();
      showAiHint();
    }
  });

  node.querySelectorAll('input, textarea').forEach((el) => {
    el.addEventListener('input', updatePreview);
  });

  experienceList.appendChild(node);
}

function createEducationItem(data = {}) {
  const node = eduTemplate.content.firstElementChild.cloneNode(true);

  node.querySelector('.edu-degree').value = data.degree || '';
  node.querySelector('.edu-school').value = data.school || '';
  node.querySelector('.edu-start').value = data.start || '';
  node.querySelector('.edu-end').value = data.end || '';
  node.querySelector('.edu-notes').value = data.notes || '';

  node.querySelector('.remove-btn').addEventListener('click', () => {
    node.remove();
    updatePreview();
  });

  node.querySelectorAll('input').forEach((el) => {
    el.addEventListener('input', updatePreview);
  });

  educationList.appendChild(node);
}

// ============================================================
// DATA GETTERS
// ============================================================

function getExperienceData() {
  return [...experienceList.querySelectorAll('.experience-item')].map((item) => ({
    role: item.querySelector('.exp-role').value.trim(),
    company: item.querySelector('.exp-company').value.trim(),
    start: item.querySelector('.exp-start').value.trim(),
    end: item.querySelector('.exp-end').value.trim(),
    desc: item.querySelector('.exp-desc').value.trim()
  }));
}

function getEducationData() {
  return [...educationList.querySelectorAll('.education-item')].map((item) => ({
    degree: item.querySelector('.edu-degree').value.trim(),
    school: item.querySelector('.edu-school').value.trim(),
    start: item.querySelector('.edu-start').value.trim(),
    end: item.querySelector('.edu-end').value.trim(),
    notes: item.querySelector('.edu-notes').value.trim()
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
    jobDescription: formEls.jobDescription.value.trim(),
    template: currentTemplate,
    experience: getExperienceData(),
    education: getEducationData()
  };
}

function getResumeText() {
  const data = getFormData();
  return [
    data.fullName, data.jobTitle, data.summary, data.skills, data.projects,
    ...data.experience.map(x => [x.role, x.company, x.desc].join(' ')),
    ...data.education.map(x => [x.degree, x.school, x.notes].join(' '))
  ].join(' ').toLowerCase();
}

function getResumeContext() {
  const data = getFormData();
  return { title: data.jobTitle, skills: data.skills, jd: data.jobDescription };
}

// ============================================================
// PREVIEW UPDATE
// ============================================================

function updateContact(data) {
  const parts = [data.email, data.phone, data.location, data.website].filter(Boolean);
  previewEls.contact.innerHTML = parts.length
    ? parts.map((item) => `<span>${escapeHtml(item)}</span>`).join('')
    : '<span>email@example.com</span><span>+1 555 555 5555</span><span>City, State</span><span>linkedin.com/in/yourname</span>';
}

function updateSkills(skillsString) {
  const items = skillsString.split(',').map(s => s.trim()).filter(Boolean);
  if (!items.length) {
    previewEls.skills.innerHTML = `<span class="skill-tag">Communication</span><span class="skill-tag">Technical Skills</span><span class="skill-tag">Leadership</span>`;
    return;
  }
  previewEls.skills.innerHTML = items.map(skill => `<span class="skill-tag">${escapeHtml(skill)}</span>`).join('');
}

function updateExperience(items) {
  const validItems = items.filter(item => item.role || item.company || item.desc);
  if (!validItems.length) {
    previewEls.experience.innerHTML = `<div class="entry"><div class="entry-head"><div><div class="entry-title">Job Title</div><div class="entry-sub">Company Name</div></div><div class="entry-date">Start - End</div></div><p class="entry-desc">Your work experience will appear here.</p></div>`;
    return;
  }
  previewEls.experience.innerHTML = validItems.map(item => {
    const dateText = [item.start, item.end].filter(Boolean).join(' - ');
    return `<div class="entry"><div class="entry-head"><div><div class="entry-title">${escapeHtml(item.role || 'Role')}</div><div class="entry-sub">${escapeHtml(item.company || 'Company')}</div></div><div class="entry-date">${escapeHtml(dateText || 'Dates')}</div></div><p class="entry-desc">${escapeHtml(normalizeBulletsForPreview(item.desc || ''))}</p></div>`;
  }).join('');
}

function updateEducation(items) {
  const validItems = items.filter(item => item.degree || item.school || item.notes);
  if (!validItems.length) {
    previewEls.education.innerHTML = `<div class="entry"><div class="entry-head"><div><div class="entry-title">Degree / Program</div><div class="entry-sub">School Name</div></div><div class="entry-date">Year - Year</div></div><p class="entry-desc">Your education will appear here.</p></div>`;
    return;
  }
  previewEls.education.innerHTML = validItems.map(item => {
    const dateText = [item.start, item.end].filter(Boolean).join(' - ');
    return `<div class="entry"><div class="entry-head"><div><div class="entry-title">${escapeHtml(item.degree || 'Degree')}</div><div class="entry-sub">${escapeHtml(item.school || 'School')}</div></div><div class="entry-date">${escapeHtml(dateText || 'Dates')}</div></div><p class="entry-desc">${escapeHtml(item.notes || '')}</p></div>`;
  }).join('');
}

function updateProjects(projectText) {
  const lines = projectText.split('\n').map(line => line.trim()).filter(Boolean);
  if (!lines.length) {
    previewEls.projects.innerHTML = '<li>Your projects and achievements will appear here.</li>';
    return;
  }
  previewEls.projects.innerHTML = lines.map(line => `<li>${escapeHtml(line)}</li>`).join('');
}

function applyTemplate(template) {
  currentTemplate = template;
  previewEls.paper.classList.remove('modern', 'classic', 'minimal');
  previewEls.paper.classList.add(template);
  templateButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.template === template);
  });
}

function updatePreview() {
  const data = getFormData();
  previewEls.name.textContent = data.fullName || 'Your Name';
  previewEls.title.textContent = data.jobTitle || 'Professional Title';
  previewEls.summary.textContent = data.summary || 'A clear, results-driven professional summary will appear here.';
  updateContact(data);
  updateSkills(data.skills);
  updateExperience(data.experience);
  updateEducation(data.education);
  updateProjects(data.projects);
  applyTemplate(data.template);
  analyzeResumeScore();
  updateCoverLetterRequirements();
}

function normalizeBulletsForPreview(text) {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => line.startsWith('•') ? line : `• ${line}`)
    .join('\n');
}

// ============================================================
// RULE-BASED IMPROVEMENT (fallback when no AI key)
// ============================================================

function improveSummaryText(text, context = {}) {
  if (!text.trim()) return text;
  const clean = text.replace(/\s+/g, ' ').replace(/\bi am\b/gi, '').trim();
  const topSkills = context.skills
    ? context.skills.split(',').map(s => s.trim()).filter(Boolean).slice(0, 4).join(', ')
    : '';
  let output = clean;
  if (output.length < 120) {
    output = `Results-driven ${context.title || 'professional'} with experience in ${topSkills || 'technical operations, troubleshooting, and cross-functional support'}. ${capitalizeFirst(clean)}.`;
  }
  output = output
    .replace(/\bworked on\b/gi, 'supported')
    .replace(/\bhelped\b/gi, 'contributed')
    .replace(/\bthings\b/gi, 'initiatives');
  return output;
}

function improveBulletLine(line, context = {}) {
  let text = line.trim();
  if (!text) return '';
  text = text.replace(/^[-•*\u2022]\s*/, '').trim();
  if (!text) return '';
  const lower = text.toLowerCase();
  let chosenVerb = strongVerbs.find(v => lower.includes(v.toLowerCase())) || null;
  if (!chosenVerb) {
    for (const weak of weakLeadIns) {
      if (lower.startsWith(weak)) {
        chosenVerb = 'Improved';
        text = text.replace(new RegExp(`^${escapeRegExp(weak)}`, 'i'), '').trim();
        break;
      }
    }
  }
  if (!chosenVerb) {
    if (lower.includes('test') || lower.includes('validation')) chosenVerb = 'Validated';
    else if (lower.includes('autom') || lower.includes('script')) chosenVerb = 'Automated';
    else if (lower.includes('debug') || lower.includes('troubleshoot')) chosenVerb = 'Resolved';
    else if (lower.includes('build') || lower.includes('develop')) chosenVerb = 'Built';
    else if (lower.includes('support')) chosenVerb = 'Supported';
    else chosenVerb = 'Improved';
  }
  text = text.replace(/^(to\s+)/i, '');
  text = text.charAt(0).toLowerCase() + text.slice(1);
  const hasMetric = /\b\d+[%x]?\b|\bpercent\b|\breduced\b|\bincreased\b|\bsaved\b|\bfaster\b/i.test(text);
  const jdKeywords = extractKeywords(context.jd || '');
  const matchingKeyword = jdKeywords.find(k => text.toLowerCase().includes(k.toLowerCase()));
  const contextSkill = (context.skills || '').split(',').map(s => s.trim()).filter(Boolean)[0];
  let result = `${chosenVerb} ${text}`;
  if (!hasMetric) {
    if (matchingKeyword) {
      result += `, strengthening ${matchingKeyword}-related execution and delivery`;
    } else if (contextSkill) {
      result += `, improving reliability, speed, and quality in ${contextSkill}`;
    } else {
      result += `, improving execution, quality, and team efficiency`;
    }
  }
  result = ensureSentence(result);
  return `• ${result}`;
}

function improveBulletBlock(text, context = {}) {
  return text.split('\n').map(line => line.trim()).filter(Boolean)
    .map(line => improveBulletLine(line, context)).join('\n');
}

function improveAllExperienceBullets() {
  [...experienceList.querySelectorAll('.exp-desc')].forEach(area => {
    area.value = improveBulletBlock(area.value, getResumeContext());
  });
  updatePreview();
}

function improveProjectsBullets() {
  formEls.projects.value = improveBulletBlock(formEls.projects.value, getResumeContext())
    .replace(/^•\s/gm, '');
  updatePreview();
}

function improveSummaryAction() {
  formEls.summary.value = improveSummaryText(formEls.summary.value, getResumeContext());
  updatePreview();
}

// ============================================================
// JD KEYWORD MATCH
// ============================================================

function analyzeJobMatch() {
  const jd = formEls.jobDescription.value.trim();
  const resumeText = getResumeText();

  if (!jd) {
    currentMatchPercent = 0;
    renderMatch([], [], ['Paste a job description to analyze match.']);
    analyzeResumeScore();
    return;
  }

  const jdKeywords = extractKeywords(jd);
  const matched = jdKeywords.filter(keyword => resumeText.includes(keyword.toLowerCase()));
  const missing = jdKeywords.filter(keyword => !resumeText.includes(keyword.toLowerCase()));
  const percent = jdKeywords.length ? Math.round((matched.length / jdKeywords.length) * 100) : 0;
  currentMatchPercent = percent;

  const suggestions = buildMatchSuggestions(matched, missing, jd);
  renderMatch(matched, missing, suggestions);
  analyzeResumeScore();
}

function buildMatchSuggestions(matched, missing, jd) {
  const suggestions = [];
  if (missing.length) {
    suggestions.push(`Add missing keywords where they are true for your experience: ${missing.slice(0, 5).join(', ')}.`);
  }
  if (!/\b\d+[%x]?\b|\bpercent\b/i.test(getResumeText())) {
    suggestions.push('Add measurable results such as percentages, time saved, scale, or output.');
  }
  if (/communication|cross-functional|team/i.test(jd) && !/communication|cross-functional|team/i.test(getResumeText())) {
    suggestions.push('Show cross-functional collaboration, communication, or stakeholder support in at least one experience bullet.');
  }
  if (/automation|script|python|terraform|docker|kubernetes/i.test(jd) && !/automation|script|python|terraform|docker|kubernetes/i.test(getResumeText())) {
    suggestions.push('If accurate, highlight automation tools, scripting, or platform technologies mentioned in the job description.');
  }
  if (!suggestions.length) {
    suggestions.push('Good alignment. Focus on tightening bullets and adding metrics for stronger impact.');
  }
  return suggestions;
}

function renderMatch(matched, missing, suggestions) {
  scoreEls.matchBadge.textContent = `${currentMatchPercent}%`;
  scoreEls.jdMatchFill.style.width = `${currentMatchPercent}%`;
  scoreEls.matchedKeywords.innerHTML = matched.length
    ? matched.map(k => `<span class="match-tag">${escapeHtml(k)}</span>`).join('')
    : `<span class="empty-text">No matched keywords yet.</span>`;
  scoreEls.missingKeywords.innerHTML = missing.length
    ? missing.map(k => `<span class="missing-tag">${escapeHtml(k)}</span>`).join('')
    : `<span class="empty-text">No major keyword gaps detected.</span>`;
  scoreEls.matchSuggestions.innerHTML = suggestions.map(item => `<li>${escapeHtml(item)}</li>`).join('');
}

function extractKeywords(text) {
  const lower = text.toLowerCase();
  const found = new Set();
  keywordLibrary.forEach(keyword => {
    if (lower.includes(keyword.toLowerCase())) found.add(keyword);
  });
  const nounCandidates = lower
    .replace(/[^a-z0-9+/#.\-\s]/g, ' ')
    .split(/\s+/).filter(Boolean)
    .filter(word => word.length > 3)
    .filter(word => !isStopWord(word));
  nounCandidates.forEach(word => {
    if (found.size < 24 && !found.has(word) && countOccurrences(lower, word) >= 2) {
      found.add(word);
    }
  });
  return [...found].slice(0, 20);
}

function isStopWord(word) {
  const stopWords = new Set([
    'with', 'that', 'this', 'from', 'have', 'will', 'your', 'their', 'about',
    'role', 'team', 'ability', 'experience', 'required', 'preferred', 'working',
    'strong', 'years', 'year', 'using', 'support', 'including', 'skills',
    'knowledge', 'solutions', 'systems', 'development', 'design', 'engineering',
    'technical', 'candidate', 'responsibilities', 'perform', 'across'
  ]);
  return stopWords.has(word);
}

function countOccurrences(text, word) {
  const matches = text.match(new RegExp(`\\b${escapeRegExp(word)}\\b`, 'g'));
  return matches ? matches.length : 0;
}

// ============================================================
// RESUME SCORE
// ============================================================

function analyzeResumeScore() {
  const data = getFormData();
  const completenessFields = [
    data.fullName, data.jobTitle, data.email, data.phone,
    data.location, data.summary, data.skills, data.projects
  ];
  const completeFilled = completenessFields.filter(Boolean).length;
  const completenessExperience = data.experience.filter(x => x.role || x.company || x.desc).length > 0 ? 1 : 0;
  const completenessEducation = data.education.filter(x => x.degree || x.school || x.notes).length > 0 ? 1 : 0;
  const completenessPercent = Math.round(((completeFilled + completenessExperience + completenessEducation) / 10) * 100);

  const allBullets = [
    ...data.experience.flatMap(x => x.desc.split('\n')),
    ...data.projects.split('\n')
  ].map(x => x.trim()).filter(Boolean);

  const strongBulletCount = allBullets.filter(isStrongBullet).length;
  const impactPercent = allBullets.length ? Math.round((strongBulletCount / allBullets.length) * 100) : 0;
  const overall = Math.round((completenessPercent * 0.4) + (impactPercent * 0.25) + (currentMatchPercent * 0.35));

  scoreEls.resumeScore.textContent = overall;
  scoreEls.resumeScoreFill.style.width = `${overall}%`;
  scoreEls.completenessScore.textContent = `${completenessPercent}%`;
  scoreEls.impactScore.textContent = `${impactPercent}%`;
  scoreEls.matchScore.textContent = `${currentMatchPercent}%`;
}

function isStrongBullet(text) {
  const t = text.toLowerCase().trim();
  if (!t) return false;
  const startsStrong = strongVerbs.some(verb => t.startsWith(verb.toLowerCase())) ||
    /^[-•*\u2022]?\s*(built|improved|validated|automated|reduced|optimized|delivered|led|implemented|developed|analyzed|resolved|streamlined|supported)\b/i.test(text);
  const hasMetric = /\b\d+[%x]?\b|\bpercent\b|\breduced\b|\bincreased\b|\bsaved\b|\bfaster\b|\bimproved\b/i.test(t);
  return startsStrong || hasMetric;
}

// ============================================================
// STORAGE & DEMO
// ============================================================

function saveToLocal() {
  const data = getFormData();
  localStorage.setItem(storageKey, JSON.stringify(data));
  saveBtn.textContent = 'Saved ✓';
  setTimeout(() => { saveBtn.textContent = 'Save Progress'; }, 1200);
}

function loadFromLocal() {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return false;
  try {
    const data = JSON.parse(raw);
    formEls.fullName.value = data.fullName || '';
    formEls.jobTitle.value = data.jobTitle || '';
    formEls.email.value = data.email || '';
    formEls.phone.value = data.phone || '';
    formEls.location.value = data.location || '';
    formEls.website.value = data.website || '';
    formEls.summary.value = data.summary || '';
    formEls.skills.value = data.skills || '';
    formEls.projects.value = data.projects || '';
    formEls.jobDescription.value = data.jobDescription || '';
    experienceList.innerHTML = '';
    educationList.innerHTML = '';
    (data.experience || []).forEach(item => createExperienceItem(item));
    (data.education || []).forEach(item => createEducationItem(item));
    if (!(data.experience || []).length) createExperienceItem();
    if (!(data.education || []).length) createEducationItem();
    applyTemplate(data.template || 'modern');
    updatePreview();
    analyzeJobMatch();
    return true;
  } catch (error) {
    console.error('Failed to load saved resume:', error);
    return false;
  }
}

function clearAll() {
  if (!confirm('Clear all resume data?')) return;
  localStorage.removeItem(storageKey);
  Object.values(formEls).forEach(el => { el.value = ''; });
  experienceList.innerHTML = '';
  educationList.innerHTML = '';
  createExperienceItem();
  createEducationItem();
  applyTemplate('modern');
  currentMatchPercent = 0;
  renderMatch([], [], ['Add a job description to get improvement suggestions.']);
  document.getElementById('coverLetterResult').innerHTML = '<p class="cl-placeholder">Your AI-generated cover letter will appear here.</p>';
  updatePreview();
}

function loadDemoResume() {
  const demo = {
    fullName: 'Alex Carter',
    jobTitle: 'Cloud & Infrastructure Engineer',
    email: 'alex.carter@email.com',
    phone: '+1 512 555 0183',
    location: 'Austin, TX',
    website: 'linkedin.com/in/alexcarter',
    summary: 'Cloud and infrastructure engineer with 4+ years of experience supporting Linux environments, automation, troubleshooting, deployment workflows, and cross-functional technical operations. Delivered reliable systems across AWS and on-premises infrastructure.',
    skills: 'AWS, Linux, Python, Terraform, Docker, Git, CI/CD, Troubleshooting, Validation, SQL',
    projects: 'Built a cloud monitoring dashboard reducing incident response time by 35%\nAutomated deployment pipeline using Python scripts, saving 3 hours per week\nImplemented standardized release process improving deployment reliability by 40%',
    template: 'modern',
    experience: [
      {
        role: 'Infrastructure Engineer',
        company: 'Tech Systems Inc.',
        start: '2023',
        end: 'Present',
        desc: 'Automated Linux cloud system provisioning using Terraform and Ansible, reducing setup time by 60%\nResolved production incidents, reducing MTTR from 4 hours to 45 minutes\nDeployed CI/CD pipelines for 12 microservices using Jenkins and Docker'
      },
      {
        role: 'Systems Support Engineer',
        company: 'NextWave Solutions',
        start: '2021',
        end: '2023',
        desc: 'Supported 200+ internal users across Linux and Windows platforms\nDeveloped Python automation scripts that eliminated 5 hours of manual work weekly\nLed validation testing for 3 major platform releases with zero critical post-release issues'
      }
    ],
    education: [
      {
        degree: 'B.S. in Information Technology',
        school: 'State University',
        start: '2017',
        end: '2021',
        notes: 'Focused on cloud systems, networking, and automation'
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
  experienceList.innerHTML = '';
  educationList.innerHTML = '';
  demo.experience.forEach(item => createExperienceItem(item));
  demo.education.forEach(item => createEducationItem(item));
  applyTemplate(demo.template);
  updatePreview();
  saveToLocal();
  document.getElementById('builder').scrollIntoView({ behavior: 'smooth' });
}

function loadDemoJd() {
  formEls.jobDescription.value = `We are seeking a Cloud Infrastructure Engineer with experience in AWS, Linux, Python, CI/CD, Docker, Terraform, troubleshooting, automation, deployment, monitoring, and cross-functional collaboration.

Responsibilities:
- Build and support cloud infrastructure
- Automate system operations and deployment workflows
- Troubleshoot production issues and improve reliability
- Work with engineering teams across development and operations
- Support validation, documentation, and incident response

Preferred:
- Experience with Git, SQL, scripting, and monitoring tools
- Strong communication and problem-solving skills`.trim();

  analyzeJobMatch();
  saveToLocal();
  document.getElementById('matcher').scrollIntoView({ behavior: 'smooth' });
}

// ============================================================
// AI GENERATION FUNCTIONS
// ============================================================

async function aiWriteSummary() {
  const data = getFormData();
  const expLines = data.experience
    .filter(e => e.role || e.company)
    .map(e => `${e.role || 'Professional'} at ${e.company || 'company'}`)
    .join(', ');

  const prompt = `Write a professional resume summary. Return ONLY the summary text — no labels, quotes, or explanation.

Name: ${data.fullName || 'Professional'}
Job Title: ${data.jobTitle || 'Professional'}
Skills: ${data.skills || 'technical skills'}
Experience: ${expLines || 'relevant professional experience'}
${data.jobDescription ? `Target Job (first 300 chars): ${data.jobDescription.slice(0, 300)}` : ''}

Rules:
- 2-3 sentences maximum
- No first-person pronouns (no I, my, me)
- Start with a strong descriptor (Results-driven, Experienced, Accomplished, etc.)
- Naturally include 2-3 top skills
- End with value delivered or career goal
- Professional, confident, ATS-friendly tone`;

  const result = await callGemini(prompt);
  if (result) {
    formEls.summary.value = result;
    updatePreview();
  }
}

async function aiWriteExpBullets(expNode) {
  const role = expNode.querySelector('.exp-role').value.trim();
  const company = expNode.querySelector('.exp-company').value.trim();
  const rawDesc = expNode.querySelector('.exp-desc').value.trim();
  const data = getFormData();

  const prompt = `Convert these job notes into 4-5 strong resume bullet points. Return ONLY the bullets, one per line, each starting with "•". No preamble or explanation.

Job Title: ${role || 'Professional'}
Company: ${company || 'Company'}
Raw Notes: ${rawDesc || 'general professional responsibilities and duties'}
${data.jobDescription ? `Target Job Description: ${data.jobDescription.slice(0, 400)}` : ''}
${data.skills ? `Candidate Skills: ${data.skills}` : ''}

Rules:
- Start each bullet with a strong action verb (Built, Automated, Reduced, Led, Implemented, Optimized, Developed, Resolved, Delivered, etc.)
- Be specific and technical
- Add realistic metrics where possible (%, numbers, time saved, scale)
- Keep bullets concise and impactful
- Make keywords align with the target job if provided
- Return exactly 4-5 bullets, each starting with "•"`;

  const result = await callGemini(prompt);
  if (result) {
    expNode.querySelector('.exp-desc').value = result
      .split('\n')
      .filter(l => l.trim())
      .map(l => l.replace(/^[•\-\*]\s*/, '').trim())
      .filter(Boolean)
      .join('\n');
    updatePreview();
  }
}

async function aiWriteProjects() {
  const data = getFormData();

  const prompt = `Write 3-4 strong resume project/achievement bullets. Return ONLY the bullets, one per line, no "•" prefix. No explanation.

Job Title: ${data.jobTitle || 'Professional'}
Skills: ${data.skills || 'technical skills'}
${data.jobDescription ? `Target Job: ${data.jobDescription.slice(0, 300)}` : ''}
${data.projects ? `Existing projects to improve: ${data.projects}` : ''}

Rules:
- Format: [Action verb] + [what you built/achieved] + [result/impact]
- Technical and specific
- Include realistic metrics (%, time saved, scale)
- 3-4 bullets only
- No bullet prefix needed`;

  const result = await callGemini(prompt);
  if (result) {
    formEls.projects.value = result
      .split('\n')
      .filter(l => l.trim())
      .map(l => l.replace(/^[•\-\*]\s*/, '').trim())
      .filter(Boolean)
      .join('\n');
    updatePreview();
  }
}

async function aiTailorResume() {
  const data = getFormData();
  if (!data.jobDescription) {
    alert('Please paste a job description first in the JD Match section, then click this button to tailor your resume to it.');
    return;
  }

  const items = [...experienceList.querySelectorAll('.experience-item')];
  const hasContent = items.some(item => item.querySelector('.exp-desc').value.trim());
  if (!hasContent) {
    alert('Please add experience bullets first, then click Tailor to JD.');
    return;
  }

  for (const item of items) {
    const role = item.querySelector('.exp-role').value.trim();
    const desc = item.querySelector('.exp-desc').value.trim();
    if (!desc) continue;

    const prompt = `Rewrite these resume bullets to better align with this job description. Keep the same real experiences but use keywords from the JD. Return ONLY the bullets, one per line, no "•" prefix.

Role: ${role || 'Professional'}
Current Bullets:
${desc}

Job Description:
${data.jobDescription.slice(0, 600)}

Rules:
- Keep the same experiences — just improve wording and keyword alignment
- Naturally incorporate important JD keywords
- Maintain or improve metrics
- Same number of bullets as input
- Strong action verbs
- No "•" prefix needed`;

    const result = await callGemini(prompt);
    if (result) {
      item.querySelector('.exp-desc').value = result
        .split('\n')
        .filter(l => l.trim())
        .map(l => l.replace(/^[•\-\*]\s*/, '').trim())
        .filter(Boolean)
        .join('\n');
    }
  }
  updatePreview();
}

async function aiGenerateCoverLetter() {
  const data = getFormData();
  const hiringManager = document.getElementById('hiringManager').value.trim();
  const companyName = document.getElementById('companyName').value.trim();
  const tone = document.getElementById('letterTone').value;

  if (!data.fullName && !data.jobTitle) {
    alert('Please fill in at least your name and job title in the Resume Builder first.');
    return;
  }
  if (!data.jobDescription) {
    alert('Please paste a job description in the JD Match section first.');
    return;
  }

  const expSummary = data.experience
    .filter(e => e.role || e.desc)
    .map(e => `${e.role}${e.company ? ' at ' + e.company : ''} (${e.start || ''}-${e.end || ''}): ${e.desc.slice(0, 120)}`)
    .join('\n');

  const toneDesc = tone === 'enthusiastic'
    ? 'enthusiastic and energetic'
    : tone === 'concise'
    ? 'concise and direct'
    : 'professional and confident';

  const greeting = hiringManager ? `Dear ${hiringManager},` : 'Dear Hiring Manager,';
  const closing = `Sincerely,\n${data.fullName || '[Your Name]'}`;

  const prompt = `Write a ${toneDesc} cover letter. Return ONLY the cover letter body text — no date, no address block.

Applicant: ${data.fullName || 'Applicant'}
Target Role: ${data.jobTitle || 'the position'}
${companyName ? 'Company: ' + companyName : ''}
Skills: ${data.skills || 'professional skills'}
Experience:\n${expSummary || 'relevant professional experience'}
${data.projects ? 'Key Projects: ' + data.projects.slice(0, 200) : ''}

Job Description:
${data.jobDescription.slice(0, 700)}

Rules:
- Start with: "${greeting}"
- Opening paragraph: strong hook about why this specific role and company
- Middle paragraph(s): 2-3 specific experiences or skills that match the JD requirements
- Closing paragraph: confident call to action with interview request
- End with: "${closing}"
- 250-320 words max
- ${toneDesc} tone throughout
- No generic filler phrases (don't say "I am writing to express my interest")
- Use specific keywords from the job description
- Sound like a real person, not a template`;

  const result = await callGemini(prompt);
  if (result) {
    const outputEl = document.getElementById('coverLetterResult');
    outputEl.innerHTML = '';
    const textarea = document.createElement('textarea');
    textarea.className = 'cl-textarea';
    textarea.value = result.trim();
    textarea.rows = 18;
    textarea.spellcheck = true;
    outputEl.appendChild(textarea);
  }
}

// ============================================================
// COVER LETTER REQUIREMENTS CHECKER
// ============================================================

function updateCoverLetterRequirements() {
  const data = getFormData();
  const hasResume = !!(data.fullName || data.jobTitle || data.summary);
  const hasJd = !!data.jobDescription;
  const hasKey = hasAiKey();

  const reqResume = document.getElementById('reqResume');
  const reqJd = document.getElementById('reqJd');
  const reqAi = document.getElementById('reqAi');

  if (reqResume) reqResume.className = 'req-item ' + (hasResume ? 'req-done' : 'req-empty');
  if (reqJd) reqJd.className = 'req-item ' + (hasJd ? 'req-done' : 'req-empty');
  if (reqAi) reqAi.className = 'req-item ' + (hasKey ? 'req-done' : 'req-empty');
}

function copyCoverLetter() {
  const ta = document.querySelector('.cl-textarea');
  if (!ta) { alert('Generate a cover letter first.'); return; }
  navigator.clipboard.writeText(ta.value).then(() => {
    const btn = document.getElementById('copyCoverLetterBtn');
    const orig = btn.textContent;
    btn.textContent = 'Copied! ✓';
    setTimeout(() => { btn.textContent = orig; }, 1500);
  }).catch(() => {
    ta.select();
    document.execCommand('copy');
  });
}

function printCoverLetter() {
  const ta = document.querySelector('.cl-textarea');
  if (!ta) { alert('Generate a cover letter first.'); return; }
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html><head><title>Cover Letter</title><style>body{font-family:Georgia,serif;max-width:680px;margin:40px auto;line-height:1.7;color:#222;font-size:1rem;}@media print{body{margin:20px;}}</style></head><body><pre style="white-space:pre-wrap;font-family:inherit;">${ta.value}</pre></body></html>`);
  win.document.close();
  win.print();
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function ensureSentence(text) {
  const clean = text.trim().replace(/\s+/g, ' ');
  if (!clean) return '';
  return /[.!?]$/.test(clean) ? clean : `${capitalizeFirst(clean)}.`;
}

function capitalizeFirst(text) {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

// ============================================================
// AI MODAL EVENT LISTENERS
// ============================================================

document.getElementById('openAiModalBtn').addEventListener('click', openAiModal);
document.getElementById('closeAiModal').addEventListener('click', closeAiModal);

document.getElementById('aiModal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('aiModal')) closeAiModal();
});

document.getElementById('saveAiKeyBtn').addEventListener('click', () => {
  const key = document.getElementById('aiKeyInput').value.trim();
  if (!key) { alert('Please enter your Gemini API key.'); return; }
  setAiKey(key);
  updateAiKeyDot();
  updateCoverLetterRequirements();
  const status = document.getElementById('aiKeyStatus');
  status.textContent = '✓ API key saved! AI features are now active.';
  status.className = 'ai-key-status success';
  status.classList.remove('hidden');
  setTimeout(closeAiModal, 1400);
});

document.getElementById('clearAiKeyBtn').addEventListener('click', () => {
  setAiKey('');
  document.getElementById('aiKeyInput').value = '';
  updateAiKeyDot();
  updateCoverLetterRequirements();
  const status = document.getElementById('aiKeyStatus');
  status.textContent = 'API key removed.';
  status.className = 'ai-key-status';
  status.classList.remove('hidden');
});

// ============================================================
// MAIN BUTTON EVENT LISTENERS
// ============================================================

Object.values(formEls).forEach(el => {
  el.addEventListener('input', () => {
    updatePreview();
    if (el === formEls.jobDescription) analyzeJobMatch();
  });
});

templateButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    applyTemplate(btn.dataset.template);
    updatePreview();
  });
});

addExperienceBtn.addEventListener('click', () => {
  createExperienceItem();
  updatePreview();
});

addEducationBtn.addEventListener('click', () => {
  createEducationItem();
  updatePreview();
});

saveBtn.addEventListener('click', saveToLocal);
clearBtn.addEventListener('click', clearAll);
printBtn.addEventListener('click', () => window.print());
loadDemoBtn.addEventListener('click', loadDemoResume);
loadDemoJdBtn.addEventListener('click', loadDemoJd);
analyzeMatchBtn.addEventListener('click', analyzeJobMatch);

// AI-aware: try AI first, fallback to rule-based
improveSummaryBtn.addEventListener('click', async () => {
  if (hasAiKey()) {
    await withAiLoading(improveSummaryBtn, aiWriteSummary);
  } else {
    improveSummaryAction();
    showAiHint();
  }
});

improveProjectsBtn.addEventListener('click', async () => {
  if (hasAiKey()) {
    await withAiLoading(improveProjectsBtn, aiWriteProjects);
  } else {
    improveProjectsBullets();
    showAiHint();
  }
});

improveAllBulletsBtn.addEventListener('click', async () => {
  if (hasAiKey()) {
    await withAiLoading(improveAllBulletsBtn, aiTailorResume);
  } else {
    improveAllExperienceBullets();
    showAiHint();
  }
});

// Cover Letter
document.getElementById('generateCoverLetterBtn').addEventListener('click', async () => {
  await withAiLoading(document.getElementById('generateCoverLetterBtn'), aiGenerateCoverLetter);
});

document.getElementById('copyCoverLetterBtn').addEventListener('click', copyCoverLetter);

document.getElementById('regenerateCoverLetterBtn').addEventListener('click', async () => {
  await withAiLoading(document.getElementById('regenerateCoverLetterBtn'), aiGenerateCoverLetter);
});

document.getElementById('printCoverLetterBtn').addEventListener('click', printCoverLetter);

// ============================================================
// INIT
// ============================================================

if (!loadFromLocal()) {
  createExperienceItem();
  createEducationItem();
  applyTemplate('modern');
  renderMatch([], [], ['Add a job description to get improvement suggestions.']);
  updatePreview();
}

updateAiKeyDot();
updateCoverLetterRequirements();
