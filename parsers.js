function parseArray(value) {
  if (!value) { return []; }
  if (Array.isArray(value)) { return value; }
  if (typeof (value) === "string") { return value.split("\n").map((line) => line.trim()).filter((line) => line); }
  throw new Error("Unsupported array format");
}

module.exports = {
  boolean: (value) => {
    if (value === undefined || value === null || value === "") { return undefined; }
    return !!(value && value !== "false");
  },
  text: (value) => {
    if (value) { return value.split("\n"); }
    return undefined;
  },
  number: (value) => {
    if (!value) { return undefined; }
    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed)) {
      throw new Error(`Value ${value} is not a valid number`);
    }
    return parsed;
  },
  autocomplete: (value) => {
    if (!value) { return undefined; }
    if (typeof (value) !== "object") { return value; }
    return value.id;
  },
  autocompleteOrArray: (value) => {
    if (!value) { return []; }
    if (Array.isArray(value)) { return value; }
    if (typeof (value) === "object") { return [value.id || value]; }
    return [value];
  },
  object: (value) => {
    if (!value) { return undefined; }
    if (typeof (value) === "object") { return value; }
    if (typeof (value) === "string") {
      try {
        return JSON.parse(value);
      } catch (e) {
        throw new Error(`Couldn't parse object: ${value}`);
      }
    }
    throw new Error(`Value ${value} is not an object`);
  },
  string: (value) => {
    if (!value) { return undefined; }
    if (typeof (value) === "string") { return value.trim(); }
    throw new Error(`Value ${value} is not a valid string`);
  },
  array: parseArray,
};
