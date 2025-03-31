chrome.storage.local.get(["enabled", "requirements"], (items) => {
  if (items.enabled && items.requirements) {
    const requirements = items.requirements;

    // Остальной код остается внутри самовызывающейся функции
    (function () {
      // Проверяем, выполняется ли скрипт в главном окне
      if (window.top === window.self) {
        const { errors, warnings } = performChecks(requirements);
        displayPopup(errors, warnings, requirements);
      }

      function performChecks(requirements) {
        const errors = [];
        const warnings = [];
        const pageContent = document.documentElement.innerHTML.toLowerCase();
        const geolangInput = document.querySelector('input[name="language"]');
        const geolangValue = geolangInput ? geolangInput.value.toUpperCase() : null;
        const countryInput = document.querySelector('input[name="country"]');
        const countryValue = countryInput ? countryInput.value.toUpperCase() : null;
        // --- MUST HAVE checks ---
        requirements.mustHave.forEach((req) => {
          if (!pageContent.includes(req.element.toLowerCase())) {
            errors.push({ message: req.message, type: "missing" });
          }
        });

        // --- MUST NOT HAVE checks ---
        requirements.mustNotHave.forEach((req) => {
          const regex = new RegExp(req.element, "i");
          if (regex.test(pageContent)) {
            errors.push({ message: req.message, type: "forbidden" });
          }
        });

        // --- CUSTOM checks ---
        requirements.custom.forEach((req) => {
          
          const elements = document.querySelectorAll(req.selector);
          elements.forEach((element) => {
            if (
              req.element === "onclick" &&
              element.hasAttribute(req.element)
            ) {
              // Ignore specific onclick value
              if (
                element.getAttribute("onclick").replace(/\s/g, "") ===
                "document.location.hash='';returnfalse;"
              ) {
                return;
              }
              errors.push({ message: req.message, type: "invalid" });
            } else if (req.element === "data-") {
              // Check data attributes for specific content
              const dataAttributes = element.attributes;
              for (let i = 0; i < dataAttributes.length; i++) {
                if (
                  dataAttributes[i].name.startsWith("data-") &&
                  (dataAttributes[i].value.includes("http") ||
                    dataAttributes[i].value.includes(".js"))
                ) {
                  errors.push({ message: req.message, type: "invalid" });
                  break;
                }
              }
            } else if (req.element === "base64") {
              // Check for base64 in attributes (excluding data:image)
              const attributes = element.attributes;
              for (let i = 0; i < attributes.length; i++) {
                if (
                  attributes[i].value.includes("base64") &&
                  !attributes[i].value.includes("data:image")
                ) {
                  errors.push({ message: req.message, type: "invalid" });
                  break;
                }
              }
            } else if (element.hasAttribute(req.element)) {
              // Check for other event attributes
              errors.push({ message: req.message, type: "invalid" });
            }
          });
        });
        function checkFormAction() {
          const form = document.querySelector('#myForm');
          if (!form) {
              errors.push({
                  message: "Форма с id='myForm' не найдена на странице.",
                  type: "missing"
              });
              return;
          }
      
          const action = form.getAttribute('action');
          if (action !== "thankyou.html") {
              errors.push({
                  message: `Форма должна иметь action="thankyou.html", но найдено action="${action}"`,
                  type: "invalid"
              });
          }
      }
      
      // Запускаем проверку
      checkFormAction();
        

        if (
          !window.jQuery &&
          !document.querySelector("script[src*='jquery']")
        ) {
          errors.push({ message: "Добавить jQuery", type: "missing" });
        }

        if (
          !document.querySelector("link[rel='icon'], link[rel='shortcut icon']")
        ) {
          errors.push({ message: "Добавить favicon", type: "missing" });
        }
        const forms = document.querySelectorAll("form");
        if (forms.length > 2) {
          errors.push({
            message: `Удалить лишние формы: ${forms.length - 2}`,
            type: "invalid",
          });
        }
        const linksWithTargetBlank =
          document.querySelectorAll('[target="_blank"]');
        if (linksWithTargetBlank.length > 0) {
          errors.push({
            message: `Ссылки с target="_blank": ${linksWithTargetBlank.length}`,
            type: "warning", // или "invalid", в зависимости от ваших требований
          });
        }

        
        const emptyInitializationPattern =
          /^(firstName|lastName|email|phone|submit|additionalFirst|additionalSecond|additionalThird):\s*'',$/m;

        if (emptyInitializationPattern.test(pageContent)) {
          errors.push({
            message: "Удали пустую инициализацию инпута,",
            type: "invalid",
          });
        }

        const styleRegex =
          /<style>[\s\S]*form:not\(\[id\]\):not\(\[class\]\)[\s\S]*display:\s*none;[\s\S]*\.stretched-link[\s\S]*display:\s*none\s*!important;[\s\S]*<\/style>/i;

        if (!styleRegex.test(document.documentElement.innerHTML)) {
          errors.push({
            message:
              "Добавить style с form:not([id]):not([class]) и .stretched-link",
            type: "missing",
          });
        }
        return { errors, warnings };
      }

      function displayPopup(errors, warnings, requirements) {
        let popup = document.getElementById("website-checker-popup"); // Получаем существующий popup

        if (!popup) {
          // Если popup не существует, создаем его
          popup = document.createElement("div");
          popup.id = "website-checker-popup";

          const closeButton = document.createElement("span");
          closeButton.innerHTML = "&times;";
          closeButton.classList.add("close-button");
          closeButton.onclick = () => popup.remove();
          popup.appendChild(closeButton);

          document.body.appendChild(popup);
        }

        // Очищаем содержимое popup перед обновлением
        popup.innerHTML = "";
        const closeButton = document.createElement("span");
        closeButton.innerHTML = "&times;";
        closeButton.classList.add("close-button");
        closeButton.onclick = () => popup.remove();
        popup.appendChild(closeButton);

        const message = document.createElement("div");

        // Группировка ошибок
        const groupedErrors = {};
        errors.forEach((error) => {
          const errorMessage = error.message;
          groupedErrors[errorMessage] = (groupedErrors[errorMessage] || 0) + 1;
        });

        if (Object.keys(groupedErrors).length > 0) {
          message.innerHTML = "<b>Ошибки:</b><ul>";
          for (const [errorMessage, count] of Object.entries(groupedErrors)) {
            message.innerHTML += `<li><span class="material-icons" style="color: #d93025; font-size: 18px; vertical-align: middle;">error</span> ${count} x ${errorMessage}</li>`;
          }
          message.innerHTML += "</ul>";
        } else if (warnings.length > 0) {
          message.innerHTML = "<b>Предупреждения:</b><ul>";
          warnings.forEach((warning) => {
            message.innerHTML += `<li><span class="material-icons" style="color: #f0ad4e; font-size: 18px; vertical-align: middle;">warning</span> ${warning.message}</li>`;
          });
          message.innerHTML += "</ul>";
        } else {
          message.textContent = "Ошибки не обнаружены.";
        }

        // Добавляем информацию о Clarity Tag
        let clarityTag = null;
        let clarityTagOwner = null;
        const clarityTagScript = document.querySelector(
          'script[src*="clarity.ms/tag/"]'
        );
        if (clarityTagScript) {
          clarityTag = clarityTagScript.src.split("/").pop();
          clarityTagOwner = Object.keys(requirements.clarityTags).find(
            (key) => requirements.clarityTags[key] === clarityTag
          );
        }
        message.innerHTML += `<p>Clarity Tag: ${clarityTag || "Не найден"} (${
          clarityTagOwner || "Неизвестно"
        })</p>`;

        popup.appendChild(message);
      }

      const slink = document.createElement("link");
      slink.rel = "stylesheet";
      slink.href = chrome.runtime.getURL("scripts/styles.css");
      document.head.appendChild(slink);

      const glink = document.createElement("link");
      glink.rel = "stylesheet";
      glink.href = "https://fonts.googleapis.com/icon?family=Material+Icons";
      document.head.appendChild(glink);
    })();
  }
});
