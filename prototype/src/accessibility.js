let controlSequence = 0;
let activeDialog = null;

function readableDataName(control) {
  const entry = Object.entries(control.dataset || {}).find(([key]) => key.endsWith("Field"));
  if (entry) {
    return String(entry[1] || entry[0]).replaceAll("_", " ");
  }
  return control.getAttribute("name") || "表单控件";
}

function directControlForLabel(label) {
  const nested = label.querySelector("input, select, textarea");
  if (nested) {
    return nested;
  }
  return Array.from(label.parentElement?.children || []).find((element) =>
    element.matches?.("input, select, textarea")
  );
}

export function associateControlLabels(root) {
  root.querySelectorAll("label").forEach((label) => {
    const control = directControlForLabel(label);
    if (!control) {
      return;
    }
    if (!control.id) {
      control.id = `geo-control-${++controlSequence}`;
    }
    if (!label.contains(control)) {
      label.htmlFor = control.id;
    }
  });

  root.querySelectorAll("input, select, textarea").forEach((control) => {
    if (
      control.labels?.length ||
      control.getAttribute("aria-label") ||
      control.getAttribute("aria-labelledby")
    ) {
      return;
    }
    control.setAttribute("aria-label", control.placeholder || readableDataName(control));
  });
}

export function enhanceRenderedUi(root) {
  if (!root || typeof root.querySelectorAll !== "function") {
    return;
  }

  associateControlLabels(root);
  root.querySelectorAll(".subtabs").forEach((tabs) => tabs.setAttribute("role", "tablist"));

  const dialog = root.querySelector('[role="dialog"]');
  if (dialog && dialog !== activeDialog) {
    activeDialog = dialog;
    dialog.querySelector("button, input, select, textarea")?.focus();
    return;
  }
  if (!dialog) {
    activeDialog = null;
  }
}
