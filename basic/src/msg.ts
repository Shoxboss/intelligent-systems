interface ParsedMessage {
  msg: string;
  cmd?: string;
  p: Array<unknown>;
}

export default {
  parseMsg(msg: string): ParsedMessage {
    // Разбор сообщения
    if (msg.endsWith("\u0000"))
      // Удаление символа в конце
      msg = msg.substring(0, msg.length - "\u0000".length);
    // Разбор сообщения
    const array = msg.match(/(\(|[-\d\.]+|[\\\"\w]+|\))/g);
    const res: ParsedMessage = {
      msg,
      p: [],
    }; // Результирующее сообщение
    // Анализировать с индекса 0, результат в res
    if (array) {
      this.parse(
        array,
        {
          idx: 0,
        },
        res
      );
    }
    this.makeCmd(res); // Выделить команду
    return res;
  },

  parse(array: RegExpMatchArray, index: { idx: number }, res: ParsedMessage) {
    // Разбор сообщения в скобках
    // Всегда с открывающей скобки
    if (array[index.idx] != "(") return;
    index.idx++;
    // Разбор внутри скобок
    this.parseInner(array, index, res);
  },

  parseInner(
    array: RegExpMatchArray,
    index: { idx: number },
    res: ParsedMessage
  ) {
    // Пока не встретится закрывающая скобка
    while (array[index.idx] != ")") {
      // Если внутри ещё одна скобка
      if (array[index.idx] == "(") {
        const r: ParsedMessage = {
          p: [],
          msg: "",
        };
        // Рекурсивный вызов с index
        this.parse(array, index, r);
        res.p.push(r);
      } else {
        // Одиночный параметр
        const num = parseFloat(array[index.idx]);
        res.p.push(isNaN(num) ? array[index.idx] : num);
        index.idx++;
      }
    }
    index.idx++;
  },

  makeCmd(res: ParsedMessage) {
    // Выделение команды
    if (res.p && res.p.length > 0) {
      // Первый параметр - команда
      res.cmd = res.p.shift() as string;
      // Выделить команды у параметров
      for (let value of res.p) this.makeCmd(value as ParsedMessage);
    }
  },
};
