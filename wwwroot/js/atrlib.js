const _TABLE_LANGUAGE = {
    "processing": "Procesando...",
    "paginate": {
        "first": "Primero",
        "last": "Ultimo",
        "next": "Siguiente",
        "previous": "Anterior",
    },
    "search": "Buscar",
    "zeroRecords": "No se han encontrado items",
};
const _TABLE_DOM = '<"top"fr>t<"justify-content-center"p>';

class FormBase {
    constructor() { }

    AddFormInput(id, name, label, col = 12) {
        
        let div = `<div class="form-group col-md-${col}">`;
        if(label != "")
            div += `<label class="form-label" for="${id}">${label}</label>`;
        div += `<input class="form-control" name="${name}" id="${id}" />
                <span id="${id}error" class="text-danger"></span>
        </div>`;

        return div;
    } 

    AddFormSelect(id, name, label, options, col = 12) {
        let div = `<div class="form-group col-md-${col}">`;
        if (label != "")
            div += `<label class="form-label" for="${id}">${label}</label>`;
        div += `<select class="form-control" name="${name}" id="${id}"/>`;

        // Opciones
        for (let i = 0; i < options.length; i++)
            div += `<option value="${options[i].value}">${options[i].text}</option>`;

        div += `</select>
                <span id="${id}error" class="text-danger"></span>
        </div>`;

        return div;
    }

    LoadFromForm(dictionary) {
        let output = JSON.parse(JSON.stringify(dictionary));

        for (let i = 0; i < dictionary.length; i++) {
            // Busca el objecto
            const element = $("#" + dictionary[i].id);
            if (element.length)
                output[i].value = $("#" + dictionary[i].id).val();
        }

        return output;
    }

    ResetForm(dictionary) {
        for (let i = 0; i < dictionary.length; i++) {
            // Busca el objecto
            const element = $("#" + dictionary[i].id);
            if (element.length)
                $("#" + dictionary[i].id).val(dictionary[i].reset);
        }
    }

    SaveToForm(dictionary, obj) {
        for (let i = 0; i < dictionary.length; i++) {
            const element = $("#" + dictionary[i].id);
            if (element.length)
                $("#" + dictionary[i].id).val(obj[dictionary[i].field]);
        }
    }

    GetApiBodyFromDictionary(dictionary) {
        let body = {};
        for (let i = 0; i < dictionary.length; i++) {
            body[dictionary[i].name] = dictionary[i].value;
        }

        return body;
    }
}

class Sample extends FormBase {
    ApiController = "samples";
    ModelName = "Sample";
    Form = [];
    Dictionary = [
        { id: "_idSampleId", value: "", name: "Id", reset: "0", field: "id"},
        { id: "_idSampleDescription", value: "", name: "Description", reset: "", field: "description" },
        { id: "_idSampleSetNumber", value: "", name: "SetNumber", reset: "", field: "setNumber" },
        { id: "_idSampleLotNumber", value: "", name: "LotNumber", reset: "", field: "lotNumber" },
        { id: "_idSampleCode", value: "", name: "Code", reset: "", field: "code" },
        { id: "_idSampleBrand", value: "", name: "Brand", reset: "", field: "brand" },
        { id: "_idSampleManufacturer", value: "", name: "Manufacturer", reset: "", field: "manufacturer" },
        { id: "_idSampleOrigin", value: "", name: "Origin", reset: "", field: "origin" },
        { id: "_idSampleCertifiedBy", value: "", name: "CertifiedBy", reset: "", field: "certifiedBy" },
    ]
    AddItemCallback = null;
    ModifyItemCallback = null;
    DeleteItemCallback = null;
    IdModify = "";
    IdDelete = "";
    Table = null;
    Url = "";

    //
    // Constructor
    //
    // config:{
    //      container: Id del contenedor. SI no existe utiliza el body
    //      id: Id base para la los modales
    //      modify: (bool) Establece si debe agregar el modal de modificar item
    //      delete: (bool) Establece si debe agregar el modal de eliminar item
    //      table: (bool) Establece si debe agregar la tabla de datos de item
    //      add_item(item): Callback para agregar nuevo item
    //      modify_item(item): Callback para modificar item
    //      delete_item(id): Callback para eliminar item
    //  }
    constructor(config) {
        super();
        if ((config == undefined) || (config == null))
            return;
        // Contenedor
        const container = config.container == undefined || config.container == "" ? $("body") : $(`#${config.container}`);
        // Id de los modales
        const id_base = config.id == undefined || config.id == "" ? "_idSample" : config.id;
        this.IdDelete = id_base + "Delete";
        this.IdModify = id_base + "Modify";
        // Callbacks
        this.AddItemCallback = config.add_item == undefined ? null : config.add_item;
        this.ModifyItemCallback = config.modify_item == undefined ? null : config.modify_item;
        this.DeleteItemCallback = config.delete_item == undefined ? null : config.delete_item;
        // Url
        this.Url = config.url;
        // Formulario
        if (config.form != undefined)
            this.Form = config.form;
        // Diccionario
        if (config.dictionary != undefined)
            this.Dictionary = config.dictionary;

        if (config.table)
            this.#AddTable(config.table_config);
        if (config.modify)
            this.#AddModalModify(this.IdModify, container);
        if (config.delete)
            this.#AddModalDelete(this.IdDelete, container);
    }

    Refresh() {
        if (this.Table != null)
            this.Table.draw();
    }

    GetForm() {
        let output = {};
        const dictionary = this.LoadFromForm(this.Dictionary);
        for (let i = 0; i < dictionary.length; i++)
            output[dictionary[i].name] = dictionary[i].value;

        return output;
    }

    OpenCreate() {
        $(`#_id${this.ModelName}Id`).val("0");
        $(`#_id${this.ModelName}EditMode`).val("create");
        $(`#${this.IdModify}`).find(".modal-title").html("Nueva muestra");
        $(`#_btn${this.ModelName}Add`).html("Agregar muestra");
        this.ResetForm(this.Dictionary);
        $(`#${this.IdModify}`).modal("show");
    }

    async OpenModify(idItem) {
        $(`#_id${this.ModelName}Id`).val(idItem);
        $(`#_id${this.ModelName}EditMode`).val("edit");
        $(`#${this.IdModify}`).find(".modal-title").html("Modificar muestra");
        $(`#_btn${this.ModelName}Add`).html("Modificar muestra");
        const r = await fetch(`${this.Url}${idItem}`);
        const response = await r.json();

        if (response.status == "fail") {
            alert(response.message);
            return;
        }
        if (response.status == "success") {
            this.SaveToForm(this.Dictionary, response.data);
        }

        $(`#${this.IdModify}`).modal("show");
    }

    OpenDelete(idItem) {
        $(`#${this.IdDelete}`).modal("show");
        $(`#_id${this.ModelName}DeleteId`).val(idItem);
    }

    #AddTable(config) {
        const filtering = config.filtering == undefined ? false : config.filtering;
        const ordering = config.ordering == undefined ? false : config.ordering;
        const filter = config.filter == undefined ? false : config.undefined;
        const pageLength = config.pageLength == undefined ? 10 : config.pageLength;
        const info = config.info == undefined ? false : config.info;
        const order = config.order == undefined ? [0, 'asc'] : config.order;
        const custom = config.custom == undefined ? {} : config.custom;

        this.Table = $("#" + config.id).DataTable({
            "language": _TABLE_LANGUAGE,
            "columnDefs": [
                { "className": "dt-center", "targets": "_all" }
            ],
            "dom": _TABLE_DOM,
            "processing": true,
            "serverSide": true,
            "ajax": {
                "url": config.url,
                "type": "POST",
                "dataType": "json"
                },
            "filter": filtering,
            "pageLength": pageLength,
            "data": null,
            "ordering": ordering,
            "order": order,
            "info": info,
            "columns": config.columns,
            ...custom
        });
    }

    #AddModalModify(id, container = "") {
        this.IdModify = id;
        // Agrega el modal
        container = container == "" ? $("body") : container;
        container.append(this.#GetDivModalModify(id));
        // Agrega los callbacks
        $(`#_btn${this.ModelName}Add`).on("click", () => {
            const mode = $(`#_id${this.ModelName}EditMode`).val();
            
            this.#AddNew(mode);
        });
    }

    #AddModalDelete(id, container = "") {
        this.IdDelete = id;
        // Agrega el modal
        container = container == "" ? $("body") : container;
        container.append(this.#GetDivModalDelete(id));
        // Agrega los callbacks
        $(`#_btn${this.ModelName}Delete`).on("click", () => {
            this.#RemoveItem();
        });
    }

    #GetFormFields() {
        let div = "";
        for (let i = 0; i < this.Form.length; i++) {
            const row = this.Form[i].row;
            div += '<div class="row">';
            for (let j = 0; j < row.length; j++) {
                const c = row[j];
                const type = c.type;
                const width = c.width == undefined ? 12 : c.width;
                if (type == "textbox")
                    div += this.AddFormInput(c.id, c.name, c.label, width);
                if (type == "select")
                    div += this.AddFormSelect(c.id, c.name, c.label, c.options, width);
            }
            div += '</div>';
        }

        return div;
    }

    #GetDivModalModify(id) {
        return `
        <div class="modal" tabindex="-1" role="dialog" id="${id}">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header bg-primary">
                        <h5 class="modal-title">Agregar muestra</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <input id="_id${this.ModelName}Id" type="hidden" name="Id" value="0" />
                        <input id="_id${this.ModelName}EditMode" type="hidden" />
                        ${this.#GetFormFields()}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Cerrar</button>
                        <button id="_btn${this.ModelName}Add" type="button" class="btn btn-primary">Agregar muestra</button>
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    #GetDivModalDelete(id) {
        let div = `
            <div class="modal" tabindex="-1" role="dialog" id="${id}">
                <div class="modal-dialog" role="document">
                    <form asp-action="Delete" asp-controller="Solicitants">
                        <input type="hidden" id="_id${this.ModelName}DeleteId" />
                        <div class="modal-content">
                            <div class="modal-header bg-danger">
                                <h5>Eliminar solicitante</h5>
                                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div class="modal-body">
                                <p>¿Esta seguro que quiere eliminar?</p>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-dismiss="modal">Cerrar</button>
                                <button type="button" class="btn btn-danger" id="_btn${this.ModelName}Delete">Eliminar</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

        `;

        return div;
    }

    async #AddNew(mode)
    {
        const bId = $(`#_id${this.ModelName}Id`).val();
        const dictionary = this.LoadFromForm(this.Dictionary);
        const method = mode == 'create' ? 'post' : 'put';
        const url = mode == 'create' ? `${this.Url}` : `${this.Url}` + bId;
        const data = this.GetApiBodyFromDictionary(dictionary);
        const r = await fetch(url,
            {
                method: method,
                body: JSON.stringify(data),
                headers: {
                    'Content-type': 'application/json; charset=UTF-8'
                }
            });
        const response = await r.json();
        $(`#${this.IdModify}`).modal('hide');
        if (response.Status == "fail") {
            alert(response.Message);
            return;
        }
        if (response.Status = "success") {
            let item = response.data;
            if (mode == "create") {
                if (this.AddItemCallback != null)
                    this.AddItemCallback(item);
            }
            else {
                if (this.ModifyItemCallback != null)
                    this.ModifyItemCallback(item);
            }
        }
    }

    async #RemoveItem() {
        const iditem = $(`#_id${this.ModelName}DeleteId`).val();
        const r = await fetch(`${this.Url}` + iditem,
            {
                method: "delete",
                headers: {
                    'Content-type': 'application/json; charset=UTF-8'
                }
            });
        const response = await r.json();
        $(`#${this.IdDelete}`).modal("hide");
        if (response.status == "fail") {
            alert(response.message);
            return;
        }
        if (response.status == "success")
            this.DeleteItemCallback(iditem);
    }

}