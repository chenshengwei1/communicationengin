import { LightningElement, api, track } from 'lwc';

export default class EmailMultiselectOption extends LightningElement {
    // Default PlaceHolder Text
    @api placeholder;

    @api disabled;

    @api readonly = !0;

    @api name;

    @api label;

    @api required;

    // Select Option List
    // e.g. [{ label: 'abc', value: 'abc'}]
    @api 
    get options(){
        return this.picklistOption;
    }

    set options(value){
        this.picklistOption = JSON.parse(JSON.stringify(value));
        console.log(this.picklistOption);
        this.setSelectedValueToInputBox();
    }

    // To control Display Selected Checkbox value in the box
    @api isShowSelectedValue;

    // Prefill selected options to the box
    @api 
    get values(){
        return this.selectedValues;
    }

    set values(value){
        console.log('Set Value');
        if (value){
            console.log('Value is not null! value: ' + value);
            if (Array.isArray(value)){
                this.selectedValues = [].concat(...value);
                this.selectedValues = this.selectedValues.filter(e=>e);
            }else{
                this.selectedValues = value.split(";");
            }
            // JSON.parse(JSON.stringify(value));;
            console.log('Values: ' + this.selectedValues);
            this.setSelectedValueToInputBox();
        }
    }

    // Actual select option list
    @track picklistOption;

    // A field to control display dropdown list or not
    isOpen = false;

    // Actual selected option value
    selectedValues = [];

    // Display text in the box
    @track
    inputValues = '';
    isFireBlur = true;

    get computedLabelClass(){
        return '';
    }
    connectedCallback(){
        this.setSelectedValueToInputBox();
        this.selectCheckboxDefaultInputValues();
    }

    selectCheckboxDefaultInputValues(){
        for(let item of this.picklistOption){
            if(this.selectedValues.indexOf(item.value) != -1){
                item.selected = true;
            }
        }
    }

    handleChange(event){
        if(this.readonly){
            return;
        }
        let selectedValue = event.currentTarget.dataset.value;
        let allSelectedOption;

        // If user select "All" option
        // Select or not select all option 
        if ('All' == selectedValue){
            let selectedOption = this.options;
            if(selectedOption && selectedOption.length > 0){
                for (let i = 0; i < selectedOption.length; i++){
                    if (i == 0){
                        selectedOption[0].selected = !selectedOption[0].selected;
                    } else {
                        selectedOption[i].selected = selectedOption[0].selected;
                    }
                }
            }

            let pickListOption = [];
            if (selectedOption[0].selected){
                for (let i = 0; i < this.options.length; i++){
                    if (i > 0){
                        pickListOption.push(this.options[i].value);
                    }
                }
            }

            allSelectedOption = pickListOption;
        }else {
            let selectedOption = this.options.filter((item)=>{
                return item.value === selectedValue
            });
            if(selectedOption && selectedOption.length > 0){
                selectedOption[0].selected = !selectedOption[0].selected;
            }

            allSelectedOption = this.getSelectedPurposeContact();
        }
        this.selectedValues = allSelectedOption;
        this.setSelectedValueToInputBox();
        this.fireEventPurposeContactChange(allSelectedOption);
        let inputElement = this.template.querySelector('[data-id="comboboxInputId"]');
        inputElement.focus();
    }

    setSelectedValueToInputBox(){
        if(this.isShowSelectedValue){
            this.inputValues = this.options.filter((item)=>{
                return this.selectedValues.indexOf(item.value) != -1;
            }).map(item=>{return item.label}).join(';');
        }
    }

    handleMultiselect(){
        if (!this.disabled){
            let section = this.template.querySelector('[data-id="sectionId"]');
            if(this.isOpen){
                section.classList.add('slds-hide');
            }else{
                section.classList.remove('slds-hide');
            }
            this.isOpen = !this.isOpen;
        }
    }

    blockKeyPres(event){
        event.preventDefault();
    }

    getSelectedPurposeContact(){
        let selectedValues = [];

        for(let option of this.options){
            if(option.selected && 'All' != option.value)
                selectedValues.push(option.value);
        }

        return selectedValues;
    }

    fireEventPurposeContactChange(allSelectedOption){
        this.dispatchEvent(
            new CustomEvent(
                'purposecontactchange',
                {
                    detail: this.selectedValues
                }
            )
        );
    }

    handleFocusChange(event){
        let element = this.template.querySelector('[data-id="sectionId"]');
        if(element.className.indexOf('slds-hide') == -1 && this.isFireBlur){
            this.handleMultiselect();
        }
    }

    handleMouseOut(){
        this.isFireBlur = true;
    }

    hanldeMouseIn(){
        this.isFireBlur = false;
    }

    inputElement(){
        return this.template.querySelector('[data-id="comboboxInputId"]');
    }

    @api setCustomValidity(message){
        this.inputElement().setCustomValidity(message);
    }

    @api reportValidity(){
        this.inputElement().reportValidity();
    }

    @api checkValidity(){
        console.log('MultipleSelect Option is valid?' + this.inputElement().checkValidity());
        return this.inputElement().checkValidity();
    }
}