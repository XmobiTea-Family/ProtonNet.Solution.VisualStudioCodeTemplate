import * as fs from 'fs';
import * as path from 'path';
import { StringUtils } from './helper/StringUtils';
import { PathUtils } from './helper/PathUtils';

export class CreateSolutionFormWebView {
    public getHtmlForm(data: {
        projectName: string,
        location: string,
        projectType: "SocketServer" | "WebApiServer",
        protonNetVersion: string,
    }) {
        return `
            <h2>Configure your new project</h2>
            <form id="dataForm">
                <!-- Project Type Dropdown -->
                <div class="form-group">
                    <label for="projectType">Project Type:</label>
                    <select id="projectType" name="projectType" required>
                        <option value="SocketServer" ${data.projectType == 'SocketServer' ? 'selected' : ''}>SocketServer Solution</option>
                        <option value="WebApiServer" ${data.projectType == 'WebApiServer' ? 'selected' : ''}>WebApiServer Solution</option>
                    </select>
                </div>

                <!-- Project Name -->
                <div class="form-group">
                    <label for="projectName">Project Name:</label>
                    <input type="text" id="projectName" name="projectName" value="${data.projectName}" required />
                </div>

                <!-- Project Location -->
                <div class="form-group">
                    <label for="location">Location:</label>
                    <input type="text" id="location" name="location" value="${data.location}" required />
                </div>

                <!-- ProtonNet Version -->
                <div class="form-group">
                    <label for="protonNetVersion">ProtonNet Version:</label>
                    <input type="text" id="protonNetVersion" name="protonNetVersion" value="${data.protonNetVersion}" required />
                </div>

                <!-- Target Runtime Dropdown -->
                <div class="form-group">
                    <label for="targetRuntime">Target Runtime:</label>
                    <select id="targetRuntime" name="targetRuntime" required>
                        <option value="net46">.NET Framework 4.6</option>
                        <option value="net461">.NET Framework 4.6.1</option>
                        <option value="net462">.NET Framework 4.6.2</option>
                        <option value="net47">.NET Framework 4.7</option>
                        <option value="net471">.NET Framework 4.7.1</option>
                        <option value="net472">.NET Framework 4.7.2</option>
                        <option value="net48">.NET Framework 4.8</option>
                        <option value="net481">.NET Framework 4.8.1</option>
                        <option value="netcoreapp3.1">.NET Core 3.1 (Out of support)</option>
                        <option value="net6.0">.NET 6.0 (Long Term Support)</option>
                        <option value="net8.0" selected>.NET 8.0 (Long Term Support) (recommend)</option>
                    </select>
                </div>

                <!-- Submit Button -->
                <input type="submit" value="Create" />
            </form>

            <script>
                const vscode = acquireVsCodeApi();

                // Handle form submission
                document.getElementById('dataForm').addEventListener('submit', function (event) {
                    event.preventDefault();

                    const projectType = document.getElementById('projectType').value;
                    const projectName = document.getElementById('projectName').value;
                    const location = document.getElementById('location').value;
                    const targetRuntime = document.getElementById('targetRuntime').value;
                    const protonNetVersion = document.getElementById('protonNetVersion').value;

                    // Get the value from the input field
                    const data = {
                        projectType: projectType,
                        projectName: projectName,
                        location: location,
                        targetRuntime: targetRuntime,
                        protonNetVersion: protonNetVersion,
                    };

                    // Send message to the extension
                    vscode.postMessage({
                        command: 'submitData',
                        data: data
                    });
                });
            </script>
            `;
    }

    public onSubmitData(data: {
        projectType: "SocketServer" | "WebApiServer",
        projectName: string,
        location: string,
        targetRuntime: string,
        protonNetVersion: string,
    }, contentPath: string): {
        status: "success" | "error",
        message: string
    } {
        let project: string = null as any;

        if (data.projectType == "SocketServer") {
            project = "Solution.XmobiTea.ProtonNet.SocketServer";
        }
        else if (data.projectType == "WebApiServer") {
            project = "Solution.XmobiTea.ProtonNet.WebApiServer";
        }

        if (!project) {
            return {
                status: "error",
                message: "can not found projectType " + data.projectType
            }
        }

        const serverFullPath = path.join(contentPath, project);
        if (!fs.existsSync(serverFullPath)) {
            return {
                status: "error",
                message: "can not found template solution for " + data.projectType
            }
        }

        const finalNamespace = StringUtils.toSafeNamespace(data.projectName);
        const finalServerFullPath = path.join(data.location, finalNamespace, finalNamespace);

        if (fs.existsSync(path.join(data.location, finalNamespace))) {
            return {
                status: "error",
                message: "project with name " + finalNamespace + " has exists, please change a new name"
            }
        }

        // Create Server here
        let serverFullPath2 = path.join(serverFullPath, "__Server__");
        let allFiles = PathUtils.getAllFiles(serverFullPath2);
        allFiles.forEach(filePath => {
            let dist = filePath.replace(serverFullPath2, finalServerFullPath).replace("__Server__", finalNamespace);

            const dir = path.dirname(dist);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

            fs.writeFileSync(dist, fs.readFileSync(filePath).toString()
                .replaceAll("__Server__", finalNamespace)
                .replaceAll("__TargetFramework__", data.targetRuntime)
                .replaceAll("__RandomAuthTokenGuid__", StringUtils.generateRandomId())
                .replaceAll("__ProtonNetVersion__", data.protonNetVersion)
            );
        });

        // Create Server.Startup here
        let serverStartupFullPath2 = path.join(serverFullPath, "__Server__.Startup");
        let allStartupFiles = PathUtils.getAllFiles(serverStartupFullPath2);
        allStartupFiles.forEach(filePath => {
            let dist = filePath.replace(serverFullPath2, finalServerFullPath).replace("__Server__", finalNamespace);

            const dir = path.dirname(dist);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

            fs.writeFileSync(dist, fs.readFileSync(filePath).toString()
                .replaceAll("__Server__", finalNamespace)
                .replaceAll("__TargetFramework__", data.targetRuntime)
                .replaceAll("__RandomAuthTokenGuid__", StringUtils.generateRandomId())
                .replaceAll("__ProtonNetVersion__", data.protonNetVersion)
            );
        });

        // Create sln file here
        let serverSolutionFullPath = path.join(serverFullPath, "__ServerSolution__.sln");
        let serverSolutionFullPathDict = serverSolutionFullPath.replace(serverFullPath, data.location).replace("__ServerSolution__.sln", finalNamespace + ".sln");
        fs.writeFileSync(serverSolutionFullPathDict, fs.readFileSync(serverSolutionFullPath).toString()
            .replaceAll("__Server__", finalNamespace)
            .replaceAll("__TargetFramework__", data.targetRuntime)
            .replaceAll("__RandomAuthTokenGuid__", StringUtils.generateRandomId())
            .replaceAll("FAE04EC0-301F-11D3-BF4B-00C04F79EFBC", StringUtils.generateRandomId().toUpperCase())
            .replaceAll("431AD0D8-15BF-4010-A236-D10F1EEF9046", StringUtils.generateRandomId().toUpperCase())
            .replaceAll("A31705D4-94BA-42C2-8440-F6C23EFC1568", StringUtils.generateRandomId().toUpperCase())
            .replaceAll("65CBB4E0-0351-4A93-9592-3DA1EC6C3754", StringUtils.generateRandomId().toUpperCase())
            .replaceAll("__ProtonNetVersion__", data.protonNetVersion)
        );

        // Create README.md file here
        let serverReadmeFullPath = path.join(serverFullPath, "README.md");
        let serverReadmeFullPathDict = serverReadmeFullPath.replace(serverFullPath, data.location);
        fs.writeFileSync(serverReadmeFullPathDict, fs.readFileSync(serverReadmeFullPath).toString()
            .replaceAll("__TargetFramework__", data.targetRuntime)
            .replaceAll("__Server__", finalNamespace)
        );

        // create .vscode
        let serverVsCodeFullPathDir = path.join(data.location, ".vscode");
        if (!fs.existsSync(serverVsCodeFullPathDir)) fs.mkdirSync(serverVsCodeFullPathDir, { recursive: true });

        {
            let launchPathDict = path.join(serverVsCodeFullPathDir, "launch.json");
            let launchJson = fs.existsSync(launchPathDict) ? JSON.parse(fs.readFileSync(launchPathDict, { encoding: "utf-8" })) : {
                "version": "0.2.0",
                "configurations": []
            };
            launchJson.configurations.push(JSON.parse(JSON.stringify({
                "name": "Launch __ServerApplication__.Startup (Debug)",
                "type": "coreclr",
                "request": "launch",
                "preLaunchTask": "build__ServerApplication__",
                "program": "__ServerApplication__.Startup",
                "args": [],
                "cwd": "${workspaceFolder}/__ServerApplication__/__ServerApplication__.Startup/bin/Debug/__TargetFramework__",
                "stopAtEntry": false,
                "console": "internalConsole",
                "justMyCode": true,
                "internalConsoleOptions": "openOnSessionStart"
            }).replaceAll("__ServerApplication__", finalNamespace).replaceAll("__TargetFramework__", data.targetRuntime)));

            fs.writeFileSync(launchPathDict, JSON.stringify(launchJson, null, 4));
        }

        {
            let tasksPathDict = path.join(serverVsCodeFullPathDir, "tasks.json");
            let tasksJson = fs.existsSync(tasksPathDict) ? JSON.parse(fs.readFileSync(tasksPathDict, { encoding: "utf-8" })) : {
                "version": "2.0.0",
                "tasks": []
            };
            tasksJson.tasks.push(JSON.parse(JSON.stringify({
                "label": "build__ServerApplication__",
                "type": "process",
                "command": "dotnet",
                "args": [
                    "build",
                    "${workspaceFolder}/__ServerApplication__/__ServerApplication__.Startup/__ServerApplication__.Startup.csproj"
                ],
                "problemMatcher": "$msCompile",
                "group": {
                    "kind": "build",
                    "isDefault": true
                },
                "detail": "Generated task for building the __ServerApplication__ solution."
            }).replaceAll("__ServerApplication__", finalNamespace)));

            fs.writeFileSync(tasksPathDict, JSON.stringify(tasksJson, null, 4));
        }

        {
            let settingsPathDict = path.join(serverVsCodeFullPathDir, "settings.json");
            let settingsJson = fs.existsSync(settingsPathDict) ? JSON.parse(fs.readFileSync(settingsPathDict, { encoding: "utf-8" })) : {};

            let hasDirty = false;
            if (settingsJson["csharp.debug.logging.moduleLoad"] == null) {
                settingsJson["csharp.debug.logging.moduleLoad"] = false;
                hasDirty = true;
            }

            if (settingsJson["files.exclude"] == null) {
                settingsJson["files.exclude"] = {
                    "**/bin": true,
                    "**/obj": true
                }
                hasDirty = true;
            }

            if (hasDirty) {
                fs.writeFileSync(settingsPathDict, JSON.stringify(settingsJson, null, 4));
            }
        }

        return {
            status: "success",
            message: ""
        }
    }

}