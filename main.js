let USERNAME = "";
let POINT = 1000;
let game_id;

// Элементы
let points = document.getElementsByClassName("point");
const gameBtn = document.querySelector("#gameBtn");

// Слушатели событий
document.querySelector("#loginWrapper form").addEventListener("submit", (event) => {
    event.preventDefault();
    auth();
  });
[...points].forEach((elem) => elem.addEventListener("click", addPoint));
gameBtn.addEventListener("click", startorStopGame);

// Функция для регистрации и логина
async function auth() {
  const loginWrapper = document.getElementById("loginWrapper");
  const login = document.getElementById("login").value;

  let response = await sendRequest("user", "GET", { username: login });

  if (response.error) {
    alert("Вы не зарегистрированы");
    let registration = await sendRequest("user", "POST", { username: login });

    if (!registration.error) {
      alert("Мы вас зарегистрировали");
      USERNAME = login;
      loginWrapper.style.display = "none";
      updateUserBalanse();
    }
  } else {
    USERNAME = login;
    loginWrapper.style.display = "none";
    updateUserBalanse();
  }
}

// Функция для выбора баллов
function addPoint(event) {
  let target = Number(event.target.innerHTML);
  POINT = +target; // Обновляем переменную POINT
  console.log(POINT);

  let activePoints = document.querySelector(".point.active");
  if (activePoints) {
    activePoints.classList.remove("active");
  }
  event.target.classList.add("active");
}

// Функция обновления баланса пользователя
async function updateUserBalanse() {
  if (!USERNAME) return;

  let response = await sendRequest("user", "GET", { username: USERNAME });

  if (response.error) {
    alert(response.message);
  } else {
    const user = document.querySelector("header span");
    user.innerHTML = `Пользователь ${response.username} с балансом ${response.balance}`;
  }
}

// Функция для кнопки начало игры
function startorStopGame() {
  if (gameBtn.innerHTML === "ИГРАТЬ") {
    gameBtn.innerHTML = "ЗАВЕРШИТЬ ИГРУ";
    gameBtn.style.backgroundColor = "red";
    startGame();
  } else {
    gameBtn.innerHTML = "ИГРАТЬ";
    gameBtn.style.backgroundColor = "#66a663";
    stopGame();
  }
}

// Функция для завершения игры
async function stopGame() {
  const response = await sendRequest("stop_game", "POST", {
    username: USERNAME,
    game_id,
  });
  console.log(response);
  updateUserBalanse();
  resetField();
}

// Функция для старта игры
async function startGame() {
  const payload = {
    username: USERNAME,
    points: POINT,
  };
  let response = await sendRequest("new_game", "POST", payload);
  if (response.error) {
    gameBtn.innerHTML = "ИГРАТЬ";
    gameBtn.style.backgroundColor = "#66a663";
  } else {
    updateUserBalanse();
    game_id = response.game_id;
    activateArea();
  }
}

// заполнение поля серым цветом
function activateArea() {
  let field = document.getElementsByClassName("field");

  for (let i = 0; i < field.length; i++) {
    const row = Math.trunc(i / 10);
    const column = i - row * 10;
    field[i].addEventListener("contextmenu", setFlag);
    field[i].setAttribute("data-row", row);
    field[i].setAttribute("data-column", column);
    field[i].addEventListener("click", makeStep);
    setTimeout(() => {
      field[i].classList.add("active");
    }, i * 30);
  }
}

async function makeStep(event) {
  const target = event.target;
  const row = +target.getAttribute("data-row");
  const column = +target.getAttribute("data-column");
  console.log(row, column);
  try {
    const response = await sendRequest("game_step", "POST", {
      game_id,
      row: row,
      column: column,
    });
    updateArea(response.table);
    if (response.error) {
      alert(response.message);
    } else {
      if (response.status === "ok") {
      } else if (response.status === "Failed") {
        alert("Вы проиграли");
        updateUserBalanse();
        gameBtn.innerHTML = "ИГРАТЬ";
        gameBtn.style.backgroundColor = "#66a663";
        setTimeout(() => {
          resetField();
        }, 2000);
      } else if (response.status === "Won") {
        alert("вы победитель");
        updateUserBalanse();
        gameBtn.innerHTML = "ИГРАТЬ";
        gameBtn.style.backgroundColor = "#66a663";
        setTimeout(() => {
          resetField();
        }, 2000);
      }
    }
  } catch (error) {
    console.log(error);
  }
}

function updateArea(table) {
  let fields = document.querySelectorAll(".field");
  let a = 0;
  for (let i = 0; i < table.length; i++) {
    let row = table[i];
    for (let j = 0; j < row.length; j++) {
      let cell = row[j];
      let value = fields[a];
      if (cell === "") {
      } else if (cell === 0) {
        value.classList.remove("active");
      } else if (cell === "BOMB") {
        value.classList.remove("active");
        value.classList.add("bomb");
      } else if (cell > 0) {
        value.classList.remove("active");
        value.innerHTML = cell;
      }
      a++;
    }
  }
}

// Флажок
function setFlag(event) {
  event.preventDefault();
  let target = event.target;
  target.classList.toggle("flag");
}

// 80 клеток через жс
function resetField() {
  const gameField = document.querySelector(".gameField");
  gameField.innerHTML = "";
  for (let i = 0; i < 80; i++) {
    const field = document.createElement("div");
    field.classList.add("field");
    gameField.appendChild(field);
  }
}
resetField();

// Функция для отправки запросов на сервер
async function sendRequest(url, method, data) {
  url = `https://tg-api.tehnikum.school/tehnikum_course/minesweeper/${url}`;

  if (method === "POST") {
    let response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    return await response.json();
  } else if (method === "GET") {
    url = url + "?" + new URLSearchParams(data);
    let response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    return await response.json();
  }
}
