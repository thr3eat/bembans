const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "../../data.json");

function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ bans: {}, appeals: {} }));
  }
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

module.exports = {
  loadData,
  saveData,
};
