import { LightningElement, api, track,wire } from 'lwc';


export default class EmailSearchableInput extends LightningElement {

    // Default PlaceHolder Text
    @api placeholder;

    @api disabled;

    @api readonly = !1;

    @api name;

    @api label;

    @api required;

    hiddenLabel = false;

    // Select Option List
    // e.g. [{ label: 'abc', value: 'abc'}]
    @api 
    get options(){
        return this.picklistOption;
    }

    set options(value){
        this.picklistOption = JSON.parse(JSON.stringify(value));
        console.log(this.picklistOption);
    }

    // To control Display Selected Checkbox value in the box
    @api isShowSelectedValue;

    // Prefill selected options to the box
    @api 
    get value(){
        return this.inputValues;
    }

    set value(value){
        console.log('Set Value');
        this.inputValues = value;
    }

    @api 
    get variant(){
        this._variant;
    }

    set variant(value){
        this._variant = value;
        this.hiddenLabel = (value == 'label-hidden');
    }

    // Actual select option list
    @track picklistOption;

    // A field to control display dropdown list or not
    isOpen = false;

    // Actual selected option value
    selectedValue = '';

    // Display text in the box
    @track
    inputValues = '';
    isFireBlur = true;


    get computedLabelClass(){
        return '';
    }
    connectedCallback(){
        this.setSelectedValueToInputBox();
    }
    renderedCallback(){
        if (!this.picklistOption || this.picklistOption.length == 0){
            let section = this.template.querySelector('[data-id="sectionId"]');
            section.classList.add('hide_for_no_item');
        }else{
            let section = this.template.querySelector('[data-id="sectionId"]');
            section.classList.remove('hide_for_no_item');
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
        if ('showmore' == selectedValue){
            this.fireEventItemSelect('showmore');
            return;
        }
        else{
            let selectedOption = this.options.find((item)=>{
                if (item.checkable===false){
                    return false;
                }
                return item.value === selectedValue;
            });
            this.options.forEach(e=>{e.selected=(selectedOption && selectedOption===e)});
            allSelectedOption = this.getSelectedPurposeContact();
        }
        this.selectedValue = allSelectedOption;
        this.setSelectedValueToInputBox();
        this.fireEventItemSelect(allSelectedOption);
        let inputElement = this.template.querySelector('[data-id="comboboxInputId"]');
        inputElement.focus();
    }

    setSelectedValueToInputBox(){
        if(this.isShowSelectedValue){
            let selectedOption = this.options.find((item)=>{
                if (item.checkable===false){
                    return false;
                }
                return item.value === this.selectedValue;
            });
            if (selectedOption){
                if (!this.inputValues){
                    this.inputValues = selectedOption.input + ';';
                }
                else if (this.inputValues.charAt(this.inputValues.length-1) == ';'){
                    this.inputValues = this.inputValues + selectedOption.input + ';';
                }else{
                    let lastIndex = this.inputValues.lastIndexOf(';');
                    if (lastIndex == -1){
                        this.inputValues = selectedOption.input +  ';';
                    }else{
                        this.inputValues = this.inputValues.substring(0,lastIndex) + ';' + selectedOption.input + ';';
                    }
                }
            }else{
                this.inputValues = '';
            }

            this.fireEventInputChange(this.inputValues);
        }
    }

    handleMultiselect(){
        if(this.isOpen){
            this.closeSection();
        }else{
            this.openSection();
        }
    }

    blockKeyPres(event){
        //event.preventDefault();
        //this.inputValues = event.detail.value;
        // when enter DEL,lightning-input no input change event,so we need a key pres event.
        this.openSection();
        this.dispatchEvent(
            new CustomEvent(
                'purposecontactchange',
                {
                    detail: {value:this.inputValues}
                }
            )
        );
    }

    openSection(){
        if (!this.disabled){
            let section = this.template.querySelector('[data-id="sectionId"]');
            section.classList.remove('slds-hide');
            let dropdow = this.template.querySelector('.slds-dropdown');
            dropdow.classList.add('slds-dropdown_fluid');
            this.isOpen = true;
            this.handleChangeInput({detail:{value:this.inputValues}});
        }
    }
    closeSection(){
        if (!this.disabled){
            let section = this.template.querySelector('[data-id="sectionId"]');
            section.classList.add('slds-hide');
            let dropdow = this.template.querySelector('.slds-dropdown');
                dropdow.classList.remove('slds-dropdown_fluid');
            this.isOpen = false;
        }
    }

    
    handleChangeInput(event){
        this.inputValues = event.detail.value;
        this.fireEventInputChange(this.inputValues);
    }

    getSelectedPurposeContact(){
        let selectedValues = this.options.find((e)=>{
            return e.selected;
        });

        return selectedValues.value;
    }

    fireEventInputChange(newInputValue){
        this.dispatchEvent(
            new CustomEvent(
                'inputchange',
                {
                    detail: {value:newInputValue}
                }
            )
        );
    }

    fireEventItemSelect(allSelectedOption){
        this.dispatchEvent(
            new CustomEvent(
                'itemselect',
                {
                    detail: {value:allSelectedOption}
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