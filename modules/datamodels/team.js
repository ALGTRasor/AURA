import { Modules } from "../modules.js";

export class Team
{
	static table_fields = ['id', 'title', 'team_name', 'team_desc'];
}

Modules.Report("Teams");