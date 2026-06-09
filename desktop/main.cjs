const { app, BrowserWindow, session } = require("electron");
const path = require("node:path");

let server;
let mainWindow;

async function startInterviewServer() {
  const { createAppServer } = await import("../src/server.js");
  server = createAppServer();

  await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  const { port } = server.address();
  return `http://127.0.0.1:${port}`;
}

function allowDesktopPermissions() {
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    const allowed = ["media", "audioCapture", "speechRecognition"].includes(permission);
    callback(allowed);
  });
}

async function createWindow() {
  const appUrl = await startInterviewServer();
  allowDesktopPermissions();

  mainWindow = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 1080,
    minHeight: 720,
    title: "简历模拟面试",
    backgroundColor: "#f6f7f4",
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 18, y: 18 },
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  await mainWindow.loadURL(appUrl);
}

app.whenReady().then(createWindow);

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  if (server) {
    server.close();
    server = null;
  }
});
