const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs").promises;

const app = express();
app.use(bodyParser.json());

const allFiles = {
  A: "fileA.txt",
  B: "fileB.txt",
  C: "fileC.txt",
  D: "fileD.txt",
};

let filesWritten = new Set();

const checkCompletionMiddleware = async (req, res, next) => {
  try {
    // Check if all four files have valid contents
    const fileChecks = Object.values(allFiles).map(async (file) => {
      try {
        const data = await fs.readFile(file, "utf-8");
        return data.trim() !== "";
      } catch (error) {
        return false; // File does not exist or cannot be read
      }
    });

    const results = await Promise.all(fileChecks);
    console.log(results);
    const allFilesHaveContents = results.every((result) => result);

    if (allFilesHaveContents) {
      return res.status(400).json({ message: "No more inputs accepted." });
    }

    next();
  } catch (error) {
    console.error("Error checking completion:", error);
    res
      .status(500)
      .json({ message: "Error checking completion. Please try again." });
  }
};

const validateInput = (number) => {
  if (typeof number !== "number" || number < 1 || number > 25) {
    throw new Error("Please enter a number between 1 and 25.");
  }
};

const getFileNumbers = async () => {
  let contents = [];
  for (const [key, file] of Object.entries(allFiles)) {
    try {
      const data = await fs.readFile(file, "utf-8");
      contents.push({
        file: file,
        contents: data.split("\n").filter(Boolean).map(Number),
      });
    } catch (error) {
      contents.push({
        file: file,
        contents: [],
      });
    }
  }
  return contents;
};

const storeContent = async (fileKey, number) => {
  const filename = allFiles[fileKey];
  try {
    await fs.appendFile(filename, `${number}\n`);
    filesWritten.add(fileKey);
  } catch (error) {
    throw new Error(`Failed to store number: ${error.message}`);
  }
};

app.post("/input", checkCompletionMiddleware, async (req, res) => {
  try {
    const { number } = req.body;
    validateInput(number);
    let fileName;
    const result = number * 7;
    if (result > 140) {
      fileName = allFiles["A"];
      await storeContent("A", result);
    } else if (result > 100) {
      fileName = allFiles["B"];
      await storeContent("B", result);
    } else if (result > 60) {
      fileName = allFiles["C"];
      await storeContent("C", result);
    } else {
      fileName = allFiles["D"];
      await storeContent("D", result);
    }

    res.status(200).json({
      message: `Number ${result} stored successfully in ${fileName}.`,
    });

    if (filesWritten.size === 4) {
      console.log(
        "Numbers have been stored in all allFiles. Process complete."
      );
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get("/file-contents", async (req, res) => {
  try {
    const contents = await getFileNumbers();
    res.status(200).json(contents);
  } catch (error) {
    res
      .status(500)
      .json({ message: `Failed to retrieve file contents: ${error.message}` });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
