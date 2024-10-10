import * as fs from 'fs';
import * as path from 'path';
import { StringUtils } from './helper/StringUtils';
import { PathUtils } from './helper/PathUtils';

export class CreateItemFormWebView {
    public getHtmlForm(data: {
        itemName: string,
        location: string,
        itemType: "RequestHandler" | "EventHandler" | "WebApiController" | "WebApiHtml"
    }) {
        let answer = `
                <h2>Add New Item (${data.itemType})</h2>
                <form id="dataForm">
                    <!-- With Model -->
                    @withModel();

                    <!-- Project Name -->
                    <div class="form-group">
                        <label for="itemName">Name:</label>
                        <input type="text" id="itemName" name="itemName" value="${data.itemName}" required />
                    </div>

                    <!-- Project Location -->
                    <div class="form-group">
                        <label for="location">Location:</label>
                        <input type="text" id="location" name="location" value="${data.location}" required disabled />
                    </div>

                    <!-- Submit Button -->
                    <input type="submit" value="Create" />
                </form>

                <script>
                    const vscode = acquireVsCodeApi();

                    // Handle form submission
                    document.getElementById('dataForm').addEventListener('submit', function (event) {
                        event.preventDefault();

                        const itemName = document.getElementById('itemName').value;
                        const location = document.getElementById('location').value;
                        let withModel = false;

                        let withModelObj = document.getElementById('withModel');
                        if (withModelObj) {
                            withModel = withModelObj.checked;
                        }

                        // Get the value from the input field
                        const data = {
                            itemName: itemName,
                            location: location,
                            withModel: withModel,
                        };

                        // Send message to the extension
                        vscode.postMessage({
                            command: 'submitData',
                            data: data
                        });
                    });
                </script>
            `;

        if (data.itemType == "RequestHandler" || data.itemType == "EventHandler") {
            answer = answer.replace("@withModel();", `
                    <div class="checkbox-container">
						<input type="checkbox" id="withModel" name="withModel" value="With Model" checked>
						<label for="withModel" class="inline-label"></label>
						<label for="withModel">With Model</label>
					</div>
            `);
        }
        else {
            answer = answer.replace("@withModel();", "");
        }

        return answer;
    }

    public onSubmitData(data: {
        itemName: string,
        location: string,
        itemType: "RequestHandler" | "EventHandler" | "WebApiController" | "WebApiHtml",
        withModel: boolean,
        rootLocation: string
    }, contentPath: string): {
        status: "success" | "error",
        message: string
    } {
        let item: string = null as any;
        let templateName: string = null as any;
        let extensionName: string = null as any;
        let codePrefix: string = null as any;
        let namespace: string = "";

        if (data.itemType == "RequestHandler") {
            if (data.withModel) {
                item = "Item.XmobiTea.ProtonNet.ModelRequestHandler";
            }
            else {
                item = "Item.XmobiTea.ProtonNet.RequestHandler";
            }

            templateName = "__Template__RequestHandler";
            extensionName = ".cs";

            const regex = "^(.*)RequestHandler[0-9]*$";
            let match1 = data.itemName.match(regex);
            codePrefix = match1 ? match1[1] : data.itemName;

            namespace = PathUtils.toNamespace(data.location.replace(data.rootLocation, "")).split('.').slice(1).join('.');
        }
        else if (data.itemType == "EventHandler") {
            if (data.withModel) {
                item = "Item.XmobiTea.ProtonNet.ModelEventHandler";
            }
            else {
                item = "Item.XmobiTea.ProtonNet.EventHandler";
            }

            templateName = "__Template__EventHandler";
            extensionName = ".cs";

            const regex = "^(.*)EventHandler[0-9]*$";
            let match1 = data.itemName.match(regex);
            codePrefix = match1 ? match1[1] : data.itemName;

            namespace = PathUtils.toNamespace(data.location.replace(data.rootLocation, "")).split('.').slice(1).join('.');
        }
        else if (data.itemType == "WebApiController") {
            item = "Item.XmobiTea.ProtonNet.WebApiController";

            templateName = "__Template__Controller";
            extensionName = ".cs";

            const regex = "^(.*)Controller[0-9]*$";
            let match1 = data.itemName.match(regex);
            codePrefix = match1 ? match1[1] : data.itemName;
            
            namespace = PathUtils.toNamespace(data.location.replace(data.rootLocation, "")).split('.').slice(1).join('.');
        }
        else if (data.itemType == "WebApiHtml") {
            item = "Item.XmobiTea.ProtonNet.WebApiHtml";

            templateName = "__Template__";
            extensionName = ".phtml";

            codePrefix = data.itemName;
        }

        if (!item) {
            return {
                status: "error",
                message: "can not found projectType " + data.itemType
            }
        }

        const serverFullPath = path.join(contentPath, item);
        if (!fs.existsSync(serverFullPath)) {
            return {
                status: "error",
                message: "can not found template item for " + data.itemType
            }
        }

        const finalClassname = StringUtils.toSafeClassname(data.itemName);
        const finalServerFullPath = path.join(data.location, finalClassname + extensionName);

        if (fs.existsSync(finalServerFullPath)) {
            return {
                status: "error",
                message: "item with name " + finalClassname + " has exists, please change a new name"
            }
        }

        fs.writeFileSync(finalServerFullPath, fs.readFileSync(path.join(serverFullPath, templateName + extensionName)).toString()
            .replaceAll("__Namespace__", namespace)
            .replaceAll(templateName, finalClassname)
            .replaceAll("__CodePrefix__", codePrefix)
        );

        return {
            status: "success",
            message: finalServerFullPath
        }
    }

}