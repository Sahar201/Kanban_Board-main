let themeSwitch = document.getElementById("theme-switch");
let body = document.body;
let currentEditBoard = null;
let arrayOfTasks = [];
let arrayOfBoards = [
  { id: 1, title: "Platform Launch" },
  { id: 2, title: "Marketing Plan" },
  { id: 3, title: "Roadmap" },
];

function loadFromLocalStorage() {
  if (localStorage.getItem("tasks")) {
    arrayOfTasks = JSON.parse(localStorage.getItem("tasks"));
  }
  if (localStorage.getItem("boards")) {
    arrayOfBoards = JSON.parse(localStorage.getItem("boards"));
  }
  if (localStorage.getItem("theme") === "light") {
    enableLightMode();
  }
}

loadFromLocalStorage();
addBoardsToPageFrom(arrayOfBoards);
addElementsToPageFrom(arrayOfTasks);

function clearModalFields() {
  document.getElementById("taskTitle").value = "";
  document.getElementById("taskDescription").value = "";
  document.getElementById("taskStatus").value = "TODO";
}

let addTaskButton = document.querySelector(".add-task");
let taskModal = document.getElementById("taskModal");

addTaskButton.onclick = function () {
  clearModalFields();
  taskModal.classList.remove("hidden");
};

let closeModalButton = document.getElementById("closeModal");
closeModalButton.onclick = function () {
  clearModalFields();
  taskModal.classList.add("hidden");
};

let saveTaskButton = document.getElementById("saveTask");
saveTaskButton.onclick = function () {
  let taskTitle = document.getElementById("taskTitle").value.trim();
  let taskDescription = document.getElementById("taskDescription").value.trim();
  let taskStatus = document.getElementById("taskStatus").value;

  if (taskTitle && taskStatus) {
    addTaskToArray(taskTitle, taskStatus, taskDescription);
    clearModalFields();
    taskModal.classList.add("hidden");
    showToast(`Task "${taskTitle}" added!`);
  } else {
    alert("Please enter a task title and status.");
  }
};

document.querySelector(".kanban-board").addEventListener("click", (e) => {
  if (e.target.classList.contains("del")) {
    let taskElement = e.target.closest(".task");
    let taskId = taskElement.getAttribute("data-id");
    let task = arrayOfTasks.find((task) => task.id == taskId);
    deleteTaskWith(taskId);
    showToast(`Task "${task.title}" deleted!`);
    return;
  }

  if (e.target.classList.contains("task") || e.target.parentElement.classList.contains("task")) {
    let taskElement = e.target.classList.contains("task")
      ? e.target
      : e.target.parentElement;
    let taskId = taskElement.getAttribute("data-id");
    openEditTaskModal(taskId);
  }
});

function openEditTaskModal(taskId) {
  let task = arrayOfTasks.find((task) => task.id == taskId);
  if (task) {
    document.getElementById("editTaskTitle").value = task.title;
    document.getElementById("editTaskDescription").value = task.description;
    document.getElementById("editTaskStatus").value = task.category;
    document.querySelector("#editTaskModal .modal-content").setAttribute("data-id", taskId);
    document.getElementById("editTaskModal").classList.remove("hidden");
  }
}

let saveEditedTaskButton = document.getElementById("saveEditedTask");
saveEditedTaskButton.onclick = function () {
  let taskId = document.querySelector("#editTaskModal .modal-content").getAttribute("data-id");
  let taskTitle = document.getElementById("editTaskTitle").value.trim();
  let taskDescription = document.getElementById("editTaskDescription").value.trim();
  let taskStatus = document.getElementById("editTaskStatus").value;

  if (taskTitle && taskStatus) {
    arrayOfTasks = arrayOfTasks.map((task) =>
      task.id == taskId
        ? { ...task, title: taskTitle, description: taskDescription, category: taskStatus }
        : task
    );
    addDataToLocalStorageFrom(arrayOfTasks);
    addElementsToPageFrom(arrayOfTasks);
    document.getElementById("editTaskModal").classList.add("hidden");
    showToast(`Task "${taskTitle}" updated!`);
  } else {
    alert("Please enter a task title and status.");
  }
};

let deleteTaskButton = document.getElementById("deleteTask");
deleteTaskButton.onclick = function () {
  let taskId = document.querySelector("#editTaskModal .modal-content").getAttribute("data-id");
  let task = arrayOfTasks.find((task) => task.id == taskId);
  deleteTaskWith(taskId);
  document.getElementById("editTaskModal").classList.add("hidden");
  showToast(`Task "${task.title}" deleted!`);
};

let closeEditModalButton = document.getElementById("closeEditModal");
closeEditModalButton.onclick = function () {
  document.getElementById("editTaskModal").classList.add("hidden");
};

function addTaskToArray(title, category, description = "") {
  let activeBoard = document.querySelector("#boardList li.active .board-title")?.textContent || "Platform Launch";
  const task = { id: Date.now(), title, category, description, board: activeBoard };
  arrayOfTasks.push(task);
  addElementsToPageFrom(arrayOfTasks);
  addDataToLocalStorageFrom(arrayOfTasks);
}

function addElementsToPageFrom(tasks) {
  let activeBoard = document.querySelector("#boardList li.active .board-title")?.textContent || "Platform Launch";
  document.querySelector(".todo").innerHTML = "<h3>🔵 TODO</h3>";
  document.querySelector(".doing").innerHTML = "<h3>🟣 DOING</h3>";
  document.querySelector(".done").innerHTML = "<h3>🟢 DONE</h3>";

  tasks
    .filter(task => task.board === activeBoard)
    .forEach((task) => {
      let div = document.createElement("div");
      div.className = `task ${task.category.toLowerCase()}`;
      div.setAttribute("data-id", task.id);
      div.setAttribute("draggable", "true");
      div.ondragstart = dragStart;
      
      let taskText = document.createElement("span");
      taskText.textContent = task.title;
      div.appendChild(taskText);

      let deleteBtn = document.createElement("button");
      deleteBtn.className = "del";
      deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        deleteTaskWith(task.id);
        showToast(`Task "${task.title}" deleted!`);
      };
      div.appendChild(deleteBtn);

      let column = document.querySelector(`.${task.category.toLowerCase()}`);
      if (column) {
        column.appendChild(div);
      }
    });

  setupDragAndDrop();
}

function addDataToLocalStorageFrom(tasks) {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function deleteTaskWith(taskId) {
  arrayOfTasks = arrayOfTasks.filter((task) => task.id != taskId);
  addDataToLocalStorageFrom(arrayOfTasks);
  addElementsToPageFrom(arrayOfTasks);
}

let touchElement = null;
let touchStartX = 0;
let touchStartY = 0;

function touchStart(event) {
  if (event.target.classList.contains('del')) return;
  
  event.preventDefault();
  touchElement = event.target.closest(".task");
  if (touchElement) {
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
    touchElement.classList.add("dragging");
  }
}

function touchMove(event) {
  if (!touchElement) return;
  
  event.preventDefault();
  let touch = event.touches[0];
  touchElement.style.position = "absolute";
  touchElement.style.left = `${touch.pageX - touchElement.offsetWidth / 2}px`;
  touchElement.style.top = `${touch.pageY - touchElement.offsetHeight / 2}px`;
}

function touchEnd(event) {
  if (!touchElement) return;
  
  const touchEndX = event.changedTouches[0].clientX;
  const touchEndY = event.changedTouches[0].clientY;
  
  if (Math.abs(touchEndX - touchStartX) < 10 && Math.abs(touchEndY - touchStartY) < 10) {
    openEditTaskModal(touchElement.getAttribute("data-id"));
    touchElement = null;
    return;
  }

  touchElement.classList.remove("dragging");
  touchElement.style.position = "";
  touchElement.style.left = "";
  touchElement.style.top = "";
  
  let touch = event.changedTouches[0];
  let dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
  let column = dropTarget ? dropTarget.closest(".column") : null;
  
  if (column) {
    let category = column.getAttribute("data-category");
    let taskId = touchElement.getAttribute("data-id");
    arrayOfTasks = arrayOfTasks.map((task) =>
      task.id == taskId ? { ...task, category } : task
    );
    addDataToLocalStorageFrom(arrayOfTasks);
    addElementsToPageFrom(arrayOfTasks);
  }
  
  touchElement = null;
}

function dragStart(event) {
  event.dataTransfer.setData("text/plain", event.target.getAttribute("data-id"));
}

function dragOver(event) {
  event.preventDefault();
  event.currentTarget.classList.add("drag-over");
}

function dragLeave(event) {
  event.currentTarget.classList.remove("drag-over");
}

function drop(event, category) {
  event.preventDefault();
  event.currentTarget.classList.remove("drag-over");
  let taskId = event.dataTransfer.getData("text/plain");
  arrayOfTasks = arrayOfTasks.map((task) =>
    task.id == taskId ? { ...task, category } : task
  );
  addDataToLocalStorageFrom(arrayOfTasks);
  addElementsToPageFrom(arrayOfTasks);
}

function setupDragAndDrop() {
  let columns = document.querySelectorAll(".column");
  columns.forEach((column) => {
    column.addEventListener("dragover", dragOver);
    column.addEventListener("dragleave", dragLeave);
    column.addEventListener("drop", (event) => {
      let category = column.getAttribute("data-category");
      drop(event, category.toUpperCase());
    });
  });
}

let hideSidebarButton = document.querySelector(".hide-sidebar");
let mobileMenuToggle = document.querySelector(".mobile-menu-toggle");
let sidebar = document.querySelector(".sidebar");

function toggleSidebar() {
  sidebar.classList.toggle("hidden");
  sidebar.classList.toggle("open");
}

hideSidebarButton.onclick = toggleSidebar;
mobileMenuToggle.onclick = toggleSidebar;

function addBoardsToPageFrom(boards) {
  let boardList = document.getElementById("boardList");
  boardList.innerHTML = "";
  boards.forEach((board) => {
    let li = document.createElement("li");
    li.className = board.title === document.getElementById("boardHeader").textContent ? "active" : "";
    li.innerHTML = `<i class="fas fa-board"></i> <span class="board-title">${board.title}</span>`;
    li.addEventListener("click", function () {
      document.querySelectorAll("#boardList li:not(.create-board)").forEach(i => i.classList.remove("active"));
      this.classList.add("active");
      document.getElementById("boardHeader").textContent = board.title;
      addElementsToPageFrom(arrayOfTasks);
    });
    li.addEventListener("dblclick", function (e) {
      e.stopPropagation();
      openEditBoardModal(li);
    });
    boardList.appendChild(li);
  });

  let createBoardLi = document.createElement("li");
  createBoardLi.className = "create-board";
  createBoardLi.innerHTML = `<i class="fas fa-plus"></i> Create New Board`;
  createBoardLi.addEventListener("click", function () {
    let boardName = prompt("Enter board name:");
    if (boardName?.trim()) {
      addNewBoard(boardName.trim());
    } else {
      alert("Board name cannot be empty.");
    }
  });
  boardList.appendChild(createBoardLi);
}

function addNewBoard(boardName) {
  let newBoard = { id: Date.now(), title: boardName };
  arrayOfBoards.push(newBoard);
  localStorage.setItem("boards", JSON.stringify(arrayOfBoards));
  addBoardsToPageFrom(arrayOfBoards);
  document.querySelector(`#boardList li:not(.create-board) .board-title`).parentElement.click();
}

function openEditBoardModal(boardElement) {
  currentEditBoard = boardElement;
  let currentName = boardElement.querySelector(".board-title").textContent;
  document.getElementById("editBoardInput").value = currentName;
  document.getElementById("editBoardModal").classList.remove("hidden");
}

document.querySelector(".menu-toggle").addEventListener("click", function () {
  let activeBoard = document.querySelector("#boardList li.active");
  if (activeBoard) {
    openEditBoardModal(activeBoard);
  }
});

document.getElementById("saveEditedBoard").onclick = function () {
  let newName = document.getElementById("editBoardInput").value.trim();
  if (newName) {
    let oldName = currentEditBoard.querySelector(".board-title").textContent;
    currentEditBoard.querySelector(".board-title").textContent = newName;
    arrayOfBoards = arrayOfBoards.map(board =>
      board.title === oldName ? { ...board, title: newName } : board
    );
    arrayOfTasks = arrayOfTasks.map(task =>
      task.board === oldName ? { ...task, board: newName } : task
    );
    localStorage.setItem("boards", JSON.stringify(arrayOfBoards));
    addDataToLocalStorageFrom(arrayOfTasks);
    document.getElementById("boardHeader").textContent = newName;
    addElementsToPageFrom(arrayOfTasks);
    document.getElementById("editBoardModal").classList.add("hidden");
    showToast(`Board "${newName}" updated!`);
    currentEditBoard = null;
  } else {
    alert("Board name cannot be empty.");
  }
};

document.getElementById("deleteBoardButton").onclick = function () {
  if (confirm("Are you sure you want to delete this board?")) {
    let boardName = currentEditBoard.querySelector(".board-title").textContent;
    arrayOfBoards = arrayOfBoards.filter(
      (board) => board.title !== boardName
    );
    arrayOfTasks = arrayOfTasks.filter((task) => task.board !== boardName);
    localStorage.setItem("boards", JSON.stringify(arrayOfBoards));
    addDataToLocalStorageFrom(arrayOfTasks);
    currentEditBoard.remove();
    document.getElementById("editBoardModal").classList.add("hidden");
    showToast(`Board "${boardName}" deleted!`);
    currentEditBoard = null;
    let firstBoard = document.querySelector("#boardList li:not(.create-board)");
    if (firstBoard) {
      firstBoard.click();
    } else {
      document.getElementById("boardHeader").textContent = "No Boards";
      addElementsToPageFrom([]);
    }
  }
};

document.getElementById("closeEditBoardModal").onclick = function () {
  document.getElementById("editBoardModal").classList.add("hidden");
  currentEditBoard = null;
};

themeSwitch.addEventListener("change", () => {
  if (themeSwitch.checked) {
    enableLightMode();
  } else {
    enableDarkMode();
  }
});

function enableLightMode() {
  document.body.classList.add("light-mode");
  themeSwitch.checked = true;
  localStorage.setItem("theme", "light");
}

function enableDarkMode() {
  document.body.classList.remove("light-mode");
  themeSwitch.checked = false;
  localStorage.setItem("theme", "dark");
}

function showToast(message) {
  let toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "1";
  }, 100);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

window.onload = function () {
  loadFromLocalStorage();
  if (window.innerWidth <= 768) {
    sidebar.classList.add("hidden");
    sidebar.classList.remove("open");
  } else {
    sidebar.classList.remove("hidden");
    sidebar.classList.add("open");
  }
};

window.onresize = function () {
  if (window.innerWidth <= 768) {
    sidebar.classList.add("hidden");
    sidebar.classList.remove("open");
  } else {
    sidebar.classList.remove("hidden");
    sidebar.classList.add("open");
  }
};
