const chart = document.getElementById("chart");

let rows = 3;
let cols = 3;

let rowLabels = ["Good", "Neutral", "Evil"];
let colLabels = ["Lawful", "Neutral", "Chaotic"];
let axisTopLabel = "X-Axis";
let axisLeftLabel = "Y-Axis";

function saveState() {
  const state = {
    rows,
    cols,
    rowLabels,
    colLabels,
    axisTopLabel,
    axisLeftLabel
  };
  localStorage.setItem("chart_state", JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem("chart_state");
  if (saved) {
    try {
      const state = JSON.parse(saved);
      rows = state.rows;
      cols = state.cols;
      rowLabels = state.rowLabels;
      colLabels = state.colLabels;
      axisTopLabel = state.axisTopLabel;
      axisLeftLabel = state.axisLeftLabel;
    } catch (err) {
      console.warn("Failed to load saved chart state:", err);
    }
  }
}

function renderGrid() {
  loadState();
  chart.innerHTML = "";

  chart.style.setProperty("--rows", rows);
  chart.style.setProperty("--cols", cols);
  chart.style.gridTemplateColumns = `60px 100px repeat(${cols}, 1fr) 40px`;
  chart.style.gridTemplateRows = `60px 40px repeat(${rows}, auto) 40px`;

  chart.appendChild(makeAt(1, 1, makeCell("", "cell")));

  const axisX = makeCell(axisTopLabel, "cell axis-label axis-x");
  axisX.contentEditable = true;
  axisX.style.gridRow = "1";
  axisX.style.gridColumn = `3 / span ${cols}`;
  axisX.addEventListener("blur", () => {
    axisTopLabel = axisX.textContent.trim();
    saveState();
    renderGrid();
  });
  chart.appendChild(axisX);

  chart.appendChild(makeAt(1, cols + 3, makeCell("", "cell")));
  chart.appendChild(makeAt(2, 1, makeCell("", "cell")));
  chart.appendChild(makeAt(2, 2, makeCell("", "cell")));

  // Column labels
  for (let c = 0; c < cols; c++) {
    const label = makeCell("", "cell label");
    label.style.gridRow = "2";
    label.style.gridColumn = `${c + 3}`;

    const span = document.createElement("div");
    span.textContent = colLabels[c] || `X${c + 1}`;
    span.contentEditable = true;
    span.addEventListener("blur", () => {
      colLabels[c] = span.textContent.trim();
      saveState();
      renderGrid();
    });
    label.appendChild(span);

    if (cols > 3) {
      const delBtn = document.createElement("button");
      delBtn.textContent = "❌";
      delBtn.className = "delete-btn";
      delBtn.title = "Delete column";
      delBtn.onclick = (e) => {
        e.stopPropagation();
        const confirmed = confirm("Are you sure you want to delete this column?");
        if (!confirmed) return;
        colLabels.splice(c, 1);
        for (let r = 0; r < rows; r++) {
          localStorage.removeItem(`cell_${r}_${c}`);
          localStorage.removeItem(`cell_text_${r}_${c}`);
        }
        cols--;
        saveState();
        renderGrid();
      };
      label.appendChild(delBtn);
    }

    chart.appendChild(label);
  }

  chart.appendChild(makeAt(2, cols + 3, makeAddButton("column")));

  // Y axis label
  const axisY = makeCell(axisLeftLabel, "cell axis-label axis-y");
  axisY.contentEditable = true;
  axisY.style.gridRow = `3 / span ${rows}`;
  axisY.style.gridColumn = `1`;
  axisY.addEventListener("blur", () => {
    axisLeftLabel = axisY.textContent.trim();
    saveState();
    renderGrid();
  });
  chart.appendChild(axisY);

  // Rows
  for (let r = 0; r < rows; r++) {
    const rowNum = r + 3;

    const rowLabel = makeCell("", "cell label");
    rowLabel.style.gridRow = `${rowNum}`;
    rowLabel.style.gridColumn = `2`;

    const span = document.createElement("div");
    span.textContent = rowLabels[r] || `Y${r + 1}`;
    span.contentEditable = true;
    span.addEventListener("blur", () => {
      rowLabels[r] = span.textContent.trim();
      saveState();
      renderGrid();
    });
    rowLabel.appendChild(span);

    if (rows > 3) {
      const delBtn = document.createElement("button");
      delBtn.textContent = "❌";
      delBtn.className = "delete-btn";
      delBtn.title = "Delete row";
      delBtn.onclick = (e) => {
        e.stopPropagation();
        const confirmed = confirm("Are you sure you want to delete this row?");
        if (!confirmed) return;
        rowLabels.splice(r, 1);
        for (let c = 0; c < cols; c++) {
          localStorage.removeItem(`cell_${r}_${c}`);
          localStorage.removeItem(`cell_text_${r}_${c}`);
        }
        rows--;
        saveState();
        renderGrid();
      };
      rowLabel.appendChild(delBtn);
    }

    chart.appendChild(rowLabel);

    // Cells
    for (let c = 0; c < cols; c++) {
      const colNum = c + 3;
      const imgKey = `cell_${r}_${c}`;
      const textKey = `cell_text_${r}_${c}`;

      const cell = makeCell("", "cell grid-cell");
      cell.contentEditable = false;
      cell.style.gridRow = `${rowNum}`;
      cell.style.gridColumn = `${colNum}`;

      // Background image
      const imgUrl = localStorage.getItem(imgKey);
      if (imgUrl) {
        cell.style.backgroundImage = `url('${imgUrl}')`;
        cell.style.backgroundSize = 'cover';
        cell.style.backgroundPosition = 'center';
      }

      // Editable overlay text
      const savedText = localStorage.getItem(textKey);
      const fallback = `${colLabels[c] || `X${c + 1}`} / ${rowLabels[r] || `Y${r + 1}`}`;
      const labelDiv = document.createElement("div");
      labelDiv.className = "combo-label";
      labelDiv.contentEditable = true;
      labelDiv.textContent = savedText ?? fallback;
      labelDiv.addEventListener("blur", () => {
        const value = labelDiv.textContent.trim();
        if (value === "" || value === fallback) {
          localStorage.removeItem(textKey);
        } else {
          localStorage.setItem(textKey, value);
        }
      });
      cell.appendChild(labelDiv);

      // Upload buttons
      const btnWrapper = document.createElement("div");
      btnWrapper.className = "upload-buttons";

      const uploadDevice = document.createElement("button");
      uploadDevice.textContent = "Upload (device)";
      uploadDevice.title = "Upload from device";
      uploadDevice.onclick = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = () => {
          const file = input.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (e) => {
            localStorage.setItem(imgKey, e.target.result);
            renderGrid();
          };
          reader.readAsDataURL(file);
        };
        input.click();
      };

      const uploadURL = document.createElement("button");
      uploadURL.textContent = "Upload (url)";
      uploadURL.title = "Upload via URL";
      uploadURL.onclick = () => {
        const url = prompt("Enter image URL:");
        if (url) {
          localStorage.setItem(imgKey, url);
          renderGrid();
        }
      };

      btnWrapper.appendChild(uploadDevice);
      btnWrapper.appendChild(uploadURL);

      // NEW: Remove image button if image exists
      if (imgUrl) {
        const clearBtn = document.createElement("button");
        clearBtn.textContent = "Delete";
        clearBtn.title = "Remove image";
        clearBtn.style.backgroundColor = "tomato";
        clearBtn.onclick = (e) => {
          e.stopPropagation();
          localStorage.removeItem(imgKey);
          renderGrid();
        };
        btnWrapper.appendChild(clearBtn);
      }

      cell.appendChild(btnWrapper);
      chart.appendChild(cell);
    }

    chart.appendChild(makeAt(rowNum, cols + 3, makeCell("", "cell")));
  }

  chart.appendChild(makeAt(rows + 3, 2, makeAddButton("row")));
  for (let c = 0; c < cols; c++) {
    chart.appendChild(makeAt(rows + 3, c + 3, makeCell("", "cell")));
  }
  chart.appendChild(makeAt(rows + 3, cols + 3, makeCell("", "cell")));
}

function makeCell(content, className = "") {
  const div = document.createElement("div");
  div.className = className || "cell";
  div.textContent = content;
  return div;
}

function makeAddButton(type) {
  const btn = makeCell("+", "cell add-button");
  btn.addEventListener("click", () => {
    if (type === "row") {
      rows++;
      rowLabels.push(`Y${rows}`);
    } else {
      cols++;
      colLabels.push(`X${cols}`);
    }
    saveState();
    renderGrid();
  });
  return btn;
}

function makeAt(row, col, element) {
  element.style.gridRow = row;
  element.style.gridColumn = col;
  return element;
}

document.getElementById("resetButton").addEventListener("click", () => {
  const confirmed = confirm("Are you sure you want to reset the entire chart?");
  if (!confirmed) return;

  localStorage.removeItem("chart_state");
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith("cell_")) {
      localStorage.removeItem(key);
    }
  });

  rows = 3;
  cols = 3;
  rowLabels = ["Good", "Neutral", "Evil"];
  colLabels = ["Lawful", "Neutral", "Chaotic"];
  axisTopLabel = "X-Axis";
  axisLeftLabel = "Y-Axis";

  saveState();
  renderGrid();
});

document.getElementById("downloadImage").addEventListener("click", () => {
  const chartElement = document.getElementById("chart");

  // Hide all add buttons before capture
  const addButtons = document.querySelectorAll(".add-button");
  addButtons.forEach(btn => btn.style.display = "none");

  html2canvas(chartElement, {
    backgroundColor: "#ffffff",
    useCORS: true
  }).then(canvas => {
    // Restore buttons after capture
    addButtons.forEach(btn => btn.style.display = "");

    const link = document.createElement("a");
    link.download = `${axisTopLabel}_${axisLeftLabel}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  });
});


renderGrid();
