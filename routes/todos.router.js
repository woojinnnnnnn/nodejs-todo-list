import express from "express";
import joi from "joi";
import Todo from "../schemas/todo.schema.js";

const router = express.Router();

// 1. 밸류 데이터는 필수적으로 존재 하야함
// 2. 밸류 데이터는 문자열 타입 이여야함
// 3, 밸류 데아터는 최소 1글자 이상
// 4. 밸류 데이터는 최대 50 글자 이하
// 5. 유효성 검사 실패시 오류 출력
const createdTodoSchema = joi.object({
  value: joi.string().min(1).max(50).required(),
});

// 할일 등록 API
router.post("/todos", async (req, res, next) => {
  try {
    // 트라이를 캐치 를 묶어서 오류가 뜨더라도 서버가 종료 되지 않게 .
    // 1. 클라이언트로 부터 받아온 밸류 데이터를 가져온다
    // const {value} = req.body;
    // 유효성 검사
    const validation = await createdTodoSchema.validateAsync(req.body);

    const { value } = validation;

    //1-5 만약 클라이언트가 밸류 데이터를 전달 하지 않았을때, 클라이언트에게 에러 메시지를 전달한다.
    if (!value) {
      return res
        .status(400)
        .json({ errorMessage: "해야 할 일 데이터가 존재 하지 않습니다." });
    }

    // 2. 해당하는 마지막 오더 데이터 조회
    // findOne 한 개의 데이터만 조회 한다.
    // 정렬 -> 어떤 컬럼을?
    const todoMaxOder = await Todo.findOne().sort("-order").exec();
    // 3. 만약 존재 한다면 현재 해야 할 일을 +1 하고 오더 데이터가 존재 하지 않다면 1 로 할당한다.
    const order = todoMaxOder ? todoMaxOder.order + 1 : 1;
    // 4. 해야할 일 등록
    const todo = new Todo({ value, order });
    await todo.save();
    // 5. 해야할 일을 클라이언트 에게 반환.
    return res.status(201).json({ todo: todo });
    // 캐치 부분.
  } catch (error) {
    // 에러 처리 미들 웨어를 실행한다.
  }
});

// 해야 할 일 목록 조회 API
router.get("/todos", async (req, res, next) => {
  // 1. 해야할 일 목록 조회
  const todos = await Todo.find().sort("-order").exec();
  // 2. 결과를 클라이언트 에게 반환.
  return res.status(200).json({ todos });
});

// 해야할 일 순서 변경, 완료/해제, 변경 API
router.patch("/todos/:todoId", async (req, res, next) => {
  const { todoId } = req.params;
  const { order, done, value } = req.body;

  // 나의 오더가 무엇인지 알아야한다.
  const currentTodo = await Todo.findById(todoId).exec();
  if (!currentTodo) {
    return res
      .status(404)
      .json({ errorMessage: "존재 하지 않는 해야 할 일 입니다." });
  }
  if (order) {
    const targetTodo = await Todo.findOne({ order }).exec();
    if (targetTodo) {
      targetTodo.order = currentTodo.order;
      await targetTodo.save();
    }
    currentTodo.order = order;
  }
  if (done !== undefined) {
    currentTodo.doneAt = done ? new Date() : null;
  }
  if (value) {
    currentTodo.value = value;
  }
  await currentTodo.save();
  return res.status(200).json({});
});
// 할 일 삭제 API
router.delete("/todos/:todoId", async (req, res, next) => {
  const { todoId } = req.params;

  const todo = await Todo.findById(todoId).exec();
  if (!todo) {
    return res
      .status(404)
      .json({ errorMessage: "존재하지 않는 해야 할 일 정보입니다." });
  }
  await Todo.deleteOne({ _id: todoId });

  return res.status(200).json({});
});

export default router;
