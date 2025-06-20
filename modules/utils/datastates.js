
export class DataState
{
    constructor(host, data = {})
    {
        this.host = host;
        this.data = data;
    }

    HasValue(property_key = '')  
    {
        if (property_key in this.data) return true;
        return false;
    };

    GetValue(property_key = '', default_value = undefined)  
    {
        if (property_key in this.data) return this.data[property_key];
        return default_value;
    };

    SetValue(property_key = '', new_value = undefined, skip_equal_values = true)  
    {
        if (skip_equal_values === true && this.data[property_key] === new_value) return;
        this.data[property_key] = new_value;
        if (this.host.dispatchEvent) this.host.dispatchEvent(new CustomEvent('datachange', { detail: this.data }));
    };

    SetValues(data = {}, skip_equal_values = true)  
    {
        let any_change = false;
        for (let property_key in data)
        {
            if (skip_equal_values === true && this.data[property_key] === data[property_key]) continue;
            this.data[property_key] = data[property_key];
            any_change = true;
        }
        if (any_change === true && this.host.dispatchEvent)
            this.host.dispatchEvent(new CustomEvent('datachange', { detail: this.data }));
    };

    static Conjure(host, data = {}) { return new DataState(host, data); }
}