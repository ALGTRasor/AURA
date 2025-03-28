import { PageManager } from "../pagemanager.js";
import { PageBase } from "./pagebase.js";

export class DatabaseProbe extends PageBase
{
	GetTitle() { return 'database probe'; }
	CreateElements(parent)
	{
		if (!parent) return;
		this.CreateBody();
		this.SetContentBodyLabel('database probe will be here');
		this.FinalizeBody(parent);
	}
}

PageManager.RegisterPage(new DatabaseProbe('database probe'));