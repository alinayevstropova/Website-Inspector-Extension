chrome.storage.local.get(["enabled", "requirements"], ({ enabled, requirements }) => {
  if (!enabled || !requirements || window.top !== window.self) {
    return;
  }

  const result = auditPage(requirements);
  renderAuditPanel(result);
});

function auditPage(requirements) {
  const html = document.documentElement.innerHTML.toLowerCase();
  const issues = [];
  const warnings = [];

  for (const rule of requirements.mustHave || []) {
    if (!html.includes(rule.element.toLowerCase())) {
      issues.push({ type: "Missing", message: rule.message });
    }
  }

  for (const rule of requirements.mustNotHave || []) {
    const pattern = new RegExp(rule.element, "i");
    if (pattern.test(html)) {
      issues.push({ type: "Review", message: rule.message });
    }
  }

  for (const rule of requirements.custom || []) {
    const matches = document.querySelectorAll(rule.selector);
    if (matches.length > 0) {
      issues.push({
        type: "Element",
        message: `${rule.message} Found ${matches.length}.`,
      });
    }
  }

  for (const rule of requirements.warnings || []) {
    const matches = document.querySelectorAll(rule.selector);
    if (Number.isInteger(rule.minCount) && matches.length < rule.minCount) {
      warnings.push({ type: "Warning", message: rule.message });
    }
  }

  runBuiltInChecks(issues, warnings);

  return { issues, warnings };
}

function runBuiltInChecks(issues, warnings) {
  const title = document.querySelector("title")?.textContent?.trim();
  if (!title) {
    issues.push({ type: "SEO", message: "Add a page title." });
  }

  const h1Count = document.querySelectorAll("h1").length;
  if (h1Count === 0) {
    warnings.push({ type: "Content", message: "Add one clear H1 heading." });
  }
  if (h1Count > 1) {
    warnings.push({ type: "Content", message: `Review H1 structure. Found ${h1Count}.` });
  }

  const imagesWithoutAlt = document.querySelectorAll("img:not([alt])").length;
  if (imagesWithoutAlt > 0) {
    issues.push({
      type: "Accessibility",
      message: `Add alt text to ${imagesWithoutAlt} image(s).`,
    });
  }

  const unsafeNewTabLinks = document.querySelectorAll(
    'a[target="_blank"]:not([rel*="noopener"])'
  ).length;

  if (unsafeNewTabLinks > 0) {
    issues.push({
      type: "Security",
      message: `Add rel="noopener noreferrer" to ${unsafeNewTabLinks} external link(s).`,
    });
  }

  const forms = document.querySelectorAll("form");
  forms.forEach((form, index) => {
    const unlabeledInputs = form.querySelectorAll(
      'input:not([type="hidden"]):not([aria-label])'
    );
    if (unlabeledInputs.length > 0) {
      warnings.push({
        type: "Forms",
        message: `Form ${index + 1} has ${unlabeledInputs.length} input(s) that may need labels.`,
      });
    }
  });
}

function renderAuditPanel({ issues, warnings }) {
  const existingPanel = document.getElementById("website-inspector-panel");
  if (existingPanel) {
    existingPanel.remove();
  }

  const panel = document.createElement("aside");
  panel.id = "website-inspector-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Website audit results");

  const header = document.createElement("div");
  header.className = "wi-header";

  const title = document.createElement("strong");
  title.textContent = "Website Inspector";

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "wi-close";
  closeButton.textContent = "x";
  closeButton.setAttribute("aria-label", "Close audit panel");
  closeButton.addEventListener("click", () => panel.remove());

  header.append(title, closeButton);
  panel.appendChild(header);

  const summary = document.createElement("p");
  summary.className = "wi-summary";
  summary.textContent =
    issues.length === 0 && warnings.length === 0
      ? "No issues found."
      : `${issues.length} issue(s), ${warnings.length} warning(s)`;
  panel.appendChild(summary);

  if (issues.length > 0) {
    panel.appendChild(createSection("Issues", issues));
  }

  if (warnings.length > 0) {
    panel.appendChild(createSection("Warnings", warnings));
  }

  document.body.appendChild(panel);
}

function createSection(title, items) {
  const section = document.createElement("section");
  const heading = document.createElement("h2");
  const list = document.createElement("ul");

  heading.textContent = title;

  for (const item of items) {
    const listItem = document.createElement("li");
    listItem.innerHTML = `<span>${escapeHtml(item.type)}</span>${escapeHtml(item.message)}`;
    list.appendChild(listItem);
  }

  section.append(heading, list);
  return section;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
