import { LightningElement,wire, api} from 'lwc';
import searchRecordList from '@salesforce/apex/EmailCommunicationController.searchRecordList';

import CONTACT_OBJECT from '@salesforce/schema/Contact';
import FIELD_NAME from '@salesforce/schema/Contact.Name';
import FIELD_ID from '@salesforce/schema/Contact.Id';
import FIELD_EMAIL from '@salesforce/schema/Contact.Email';


const FIELDS = [FIELD_NAME, FIELD_ID, FIELD_EMAIL];

export default class EmailRecipientInput extends LightningElement {
    filterVars;
    pageSize = 10;
    contactList = [];
    
    total = 0;
    displayItems = [];
    _value = '';

    @api required;

    @api
    label;

    //getRecordList(ObjectRecordApi objectApi, FieldRecordApi[] fields, FieldRecordApi[] filterVars, Integer offset, Integer limits)
    @wire(searchRecordList, {objectApi: CONTACT_OBJECT, fields:FIELDS, filterVars:'$filterVars', offset:0, limits:'$pageSize'})
    wire_getRecordList({error, data}){
        this.contactList = [];
        this.total = 0;
        if (data){
            (data.result || []).forEach(e=>{
                this.contactList.push(JSON.parse(JSON.stringify(e)));
            });
            this.total = data.count;
            this.renderDropItems();
            console.log(data.count);
        }else if (error){
            this.error = error;
        }
    }

    get value(){
        return this._value;
    }

    set value(val){
        this._value = val;
    }
    
    /**
     * too many record don't show all,every time click showmore,we can query more data to show.
     * @param {*} event 
     */
    handleShowMore(event){
        if (event.detail.value == 'showmore'){
            this.pageSize = this.pageSize + 10;
        }else{
            this.fireEventItemChange(event);
        }
    }

    purposeContactChange(event){
        let oldValue = this._value;
        let filter = event.detail.value;
        this._value = filter;


        if (!filter) {
            this.renderDropItems();
            return;
        }else{
            this.pageSize = 10;
            
            let emails = filter.split(';');
            if (emails.length > 0){
                let searchVar = emails[emails.length-1];
                this.filterVars = [{value:searchVar, fieldApiName:FIELD_EMAIL.fieldApiName}];
            }else{
                this.filterVars = [{value:'', fieldApiName:FIELD_EMAIL.fieldApiName}];
            }
        }

        if (oldValue !== this._value){
            this.fireEventInputChange(this._value);
        }
    }

    renderDropItems(){
        this.displayItems = (this.contactList || []).map((e, index)=>{
            let inputEmail = e.Name? (`${e.Name} <${e.Email}>`):e.Email;
            return {label:e.Name, value:e.Id,icon:'standard:account',selectable:true, input:inputEmail};
        })
        if (this.total>this.displayItems.length){
            this.displayItems.push({label:'Show More...', value:'showmore',icon:'',selectable:false, checkable: false})
        }
    }

    fireEventItemChange(event){
        this.dispatchEvent(
            new CustomEvent(
                'itemselect',
                event
            )
        );
    }

    fireEventInputChange(newValue){
        this.dispatchEvent(
            new CustomEvent(
                'inputchange',
                {
                    detail: {value:newValue}
                }
            )
        );
    }
}