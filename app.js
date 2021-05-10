const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const addDate = require("date-fns");
const format = require("date-fns");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const formatMonth = (input) => {
  if (input > 9) {
    return `${input}`;
  } else {
    return `0${input}`;
  }
};

const formatDate = (date) => {
  if (date > 9) {
    return `${date}`;
  } else {
    return `0${date}`;
  }
};

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    category: dbObject.category,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  };
};

const priorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const priorityProperties = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const statusProperties = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const categoryProperties = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const categoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const categoryAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const getStatus = (statusInput) => {
  const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
  const isPresent = statusArray.includes(statusInput);
  return isPresent;
};

const getCategory = (categoryInput) => {
  const categoryArray = ["WORK", "HOME", "LEARNING"];
  const isPresent = categoryArray.includes(categoryInput);
  return isPresent;
};

const getPriority = (priorityInput) => {
  const priorityArray = ["HIGH", "MEDIUM", "LOW"];
  const isPresent = priorityArray.includes(priorityInput);
  return isPresent;
};

const getDateFormat = (date) => {
  const isValidDate = addDate.format(new Date(date), "yyyy-MM-dd");
  console.log(isValidDate);
  return isValidDate;
};

// middleware for post ans put request

const isValidRequest = (request, response, next) => {
  const requestBody = request.body;

  switch (true) {
    case requestBody.status !== undefined:
      if (getStatus(requestBody.status)) {
        next();
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case requestBody.category !== undefined:
      if (getCategory(requestBody.category)) {
        next();
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case requestBody.priority !== undefined:
      if (getPriority(requestBody.priority)) {
        next();
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    default:
      next();
      break;
  }
};

// middleWare

const ifQueryValid = (request, response, next) => {
  const reqQueryElement = request.query;

  switch (true) {
    case reqQueryElement.category !== undefined &&
      reqQueryElement.priority !== undefined:
      if (
        getCategory(reqQueryElement.category) &&
        getPriority(reqQueryElement.priority)
      ) {
        next();
      } else {
        response.status(400);
        response.send("Invalid Todo Category and Priority");
      }
      break;
    case reqQueryElement.category !== undefined &&
      reqQueryElement.status !== undefined:
      if (
        getCategory(reqQueryElement.category) &&
        getStatus(reqQueryElement.status)
      ) {
        next();
      } else {
        response.status(400);
        response.send("Invalid Todo Category and Status");
      }
      break;
    case reqQueryElement.priority !== undefined &&
      reqQueryElement.status !== undefined:
      if (
        getPriority(reqQueryElement.priority) &&
        getStatus(reqQueryElement.status)
      ) {
        next();
      } else {
        response.status(400);
        response.send("Invalid Todo Priority and Status");
      }
      break;
    case reqQueryElement.status !== undefined:
      if (getStatus(reqQueryElement.status)) {
        next();
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case reqQueryElement.category !== undefined:
      if (getCategory(reqQueryElement.category)) {
        next();
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case reqQueryElement.priority !== undefined:
      if (getPriority(reqQueryElement.priority)) {
        next();
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case reqQueryElement.date !== undefined:
      if (getDateFormat(reqQueryElement.date) === "yyyy-MM-dd") {
        next();
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
    default:
      next();
      break;
  }
};

//API 1

app.get("/todos/", ifQueryValid, async (request, response) => {
  const { search_q = "", priority, status, category } = request.query;
  let getTodosQuery = "";
  let todoArray = null;

  switch (true) {
    case priorityAndStatusProperties(request.query):
      getTodosQuery = `
    SELECT 
        *
    FROM 
        todo
    WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}';`;
      break;
    case priorityProperties(request.query):
      getTodosQuery = `
    SELECT 
        *
    FROM 
        todo
    WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}';`;
      break;
    case statusProperties(request.query):
      getTodosQuery = `
    SELECT 
        *
    FROM 
        todo
    WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}';`;

      break;
    case categoryProperties(request.query):
      getTodosQuery = `
    SELECT 
        *
    FROM 
        todo
    WHERE
         category = '${category}';`;
      break;
    case categoryAndStatusProperties(request.query):
      getTodosQuery = `
    SELECT 
        *
    FROM 
        todo
    WHERE
         category = '${category}'
          AND status = '${status}';`;
      break;
    case categoryAndPriorityProperties(request.query):
      getTodosQuery = `
    SELECT 
        *
    FROM 
        todo
    WHERE
         category = '${category}'
          AND priority = '${priority}';`;
      break;
    default:
      getTodosQuery = `
    SELECT 
        *
    FROM 
        todo
    WHERE
        todo LIKE '%${search_q}%';`;
  }
  todoArray = await db.all(getTodosQuery);
  console.log(todoArray);
  response.send(
    todoArray.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
  );
});

// API 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT * FROM todo WHERE id = ${todoId};`;
  const todoItem = await db.get(getTodoQuery);
  response.send(convertDbObjectToResponseObject(todoItem));
});

//API 3

app.get("/agenda/", ifQueryValid, async (request, response) => {
  const { date } = request.query;
  const dateString = addDate.format(new Date(date), "yyyy-MM-dd");
  const dateFormate = new Date(dateString);
  const yy = dateFormate.getFullYear();
  const mm = parseInt(formatMonth(dateFormate.getMonth() + 1));

  const dd = parseInt(formatDate(dateFormate.getDate()));

  const getDateQuery = `
    SELECT * FROM todo 
    WHERE
    strftime('%Y', due_date) LIKE ${yy} and 
     CAST(strftime('%m', due_date) AS INTEGER) LIKE ${mm} and 
     CAST(strftime('%d', due_date) AS INTEGER) LIKE ${dd};`;
  const dateArray = await db.all(getDateQuery);
  response.send(dateArray);
});

// API 4

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  console.log(request.body);

  const getTodoQuery = `
    INSERT INTO 
    todo (id, todo, priority, status, category, due_date)
    VALUES
    (${id},'${todo}','${priority}','${status}','${category}',${dueDate});`;

  await db.run(getTodoQuery);

  response.send("Todo Successfully Added");
});

// API 5

app.put("/todos/:todoId/", isValidRequest, async (request, response) => {
  const { todoId } = request.params;
  console.log(request.body);

  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.category !== undefined:
      updateColumn = "Category";
      break;
    case requestBody.dueDate !== undefined:
      updateColumn = "Due Date";
      break;
  }
  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.due_date,
  } = request.body;

  const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}',
      category ='${category}',
      due_date = ${dueDate}
    WHERE
      id = ${todoId};`;

  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

// API 6

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    DELETE FROM todo WHERE id = ${todoId};`;
  const dbResponse = await db.run(getTodoQuery);

  if (dbResponse.changes === 0) {
    response.status(401);
    response.send("Invalid Request");
  } else {
    response.send("Todo Deleted");
  }
});

module.exports = app;
