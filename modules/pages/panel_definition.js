export class PanelDefinition
{
    create = _ => { };
    remove = _ => { };
    update = _ => { };
    reset = _ => { };

    constructor(instructions)
    {
        if (!instructions) return;
        if (instructions.create) this.create = instructions.create;
        if (instructions.remove) this.remove = instructions.remove;
        if (instructions.update) this.update = instructions.update;
        if (instructions.reset) this.reset = instructions.reset;
    }
    static CreateField = (parent, label = '[field label]', validator = _ => _.trim(), read_only = false, spellcheck = false) =>
    {
        let fvp = new FieldValuePanel();
        fvp.label = label;
        fvp.edit_mode = read_only !== true;
        fvp.spellcheck = spellcheck;
        fvp.validator = validator;
        fvp.onValueChangedDelayed.RequestSubscription(_ => { parent.OnAnyValueChanged(); });

        let e_fvp = parent.PushChild(fvp);
        e_fvp.Create(parent.e_block);
        return e_fvp;
    };

    static def_UserSummary = new PanelDefinition(
        {
            create: _ =>
            {
                _.field_panels.id = PanelDefinition.CreateField(_, 'user id', undefined, true);
                _.field_panels.name = PanelDefinition.CreateField(_, 'legal name');
                _.field_panels.team = PanelDefinition.CreateField(_, 'department');
                _.field_panels.role = PanelDefinition.CreateField(_, 'role(s)');
                _.field_panels.manager = PanelDefinition.CreateField(_, 'manager id');
                _.field_panels.email_company = PanelDefinition.CreateField(_, 'company email', FieldValidation.CheckEmail);
                _.field_panels.email_personal = PanelDefinition.CreateField(_, 'personal email', FieldValidation.CheckEmail);
                _.field_panels.address_company = PanelDefinition.CreateField(_, 'company address', undefined, false, true);
                _.field_panels.address_personal = PanelDefinition.CreateField(_, 'personal address', undefined, false, true);
                _.field_panels.phone_company = PanelDefinition.CreateField(_, 'company phone', FieldValidation.CheckPhone);
                _.field_panels.phone_personal = PanelDefinition.CreateField(_, 'personal phone', FieldValidation.CheckPhone);
                _.field_panels.birth_date = PanelDefinition.CreateField(_, 'birth date', FieldValidation.CheckDate);
                _.field_panels.start_date = PanelDefinition.CreateField(_, 'tenure start', FieldValidation.CheckDate);
                _.field_panels.end_date = PanelDefinition.CreateField(_, 'tenure end', FieldValidation.CheckDate);
            },
            update: _ =>
            {
                _.field_panels.id.value = _.record.Title;
                _.field_panels.name.value = _.record.display_name_full;
                _.field_panels.team.value = _.record.user_team;
                _.field_panels.role.value = _.record.user_role;
                _.field_panels.manager.value = _.record.user_manager_id;
                _.field_panels.email_company.value = _.record.email_work;
                _.field_panels.email_personal.value = _.record.email_home;
                _.field_panels.address_company.value = _.record.address_work;
                _.field_panels.address_personal.value = _.record.address_home;
                _.field_panels.phone_company.value = _.record.phone_work;
                _.field_panels.phone_personal.value = _.record.phone_home;
                _.field_panels.birth_date.value = _.record.user_birthdate;
                _.field_panels.start_date.value = _.record.date_start;
                _.field_panels.end_date.value = _.record.date_end === undefined ? '-' : _.record.date_end;
            },
            reset: _ => { for (let fid in _.field_panels) _.field_panels[fid].value = undefined; }
        }
    );
}
