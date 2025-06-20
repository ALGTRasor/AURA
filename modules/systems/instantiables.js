export class Instantiable
{
    constructor()
    {
        this.created = false;
    }

    Create()
    {
        if (this.created === true) return;
        this.created = true;
        this.OnCreate();
    }

    Release()
    {
        if (this.created !== true) return;
        this.created = false;
        this.OnRelease();
    }

    Recreate() { this.Release(); this.Create(); }
    Update() { this.OnUpdate(); }

    OnCreate() { }
    OnRelease() { }
    OnUpdate() { }
}