import { LightningElement, api, wire, track} from 'lwc';
import getEmailTemplates from '@salesforce/apex/EmailCommunicationController.getEmailTemplates';

export default class EmailTemplateSelect extends LightningElement {

    @api showModal = false;
    @api message;
    @api modalHeading;
    @api callbackMessage;

    selectedRows;

    openModal() {
        this.showModal = true;
    }

    closeModal() {
        this.showModal = false;
        this.handleClick({target:{name:'cancel'}});
    }

    handleClick(event){
        //creates object which will be published to the parent component
        let finalEvent = {
            callbackMessage: this.callbackMessage,
            status: event.target.name,
            templates: this.selectedRows
        };

        //dispatch a 'click' event so the parent component can handle it
        this.dispatchEvent(new CustomEvent('clickclose', {detail: finalEvent}));
    }

    //Subject,Id, Name,DeveloperName, FolderId, Folder.DeveloperName, Folder.Name
    columns = [
        {label: 'Name', fieldName: 'Name', type: 'text',sortable: true},
        {label: 'Subject', fieldName: 'Subject', type: 'text'},
        {label: 'DeveloperName', fieldName: 'DeveloperName', type: 'text'},
        {label: 'Description', fieldName: 'Description', type: 'percentage'}
        ];

    @track
    templateList = [];

    @wire(getEmailTemplates)
    wire_allContacts({error, data}){
        this.contactList = [];
        if (data){
            data.forEach(e=>{
                this.templateList.push(JSON.parse(JSON.stringify(e)));
            });
        }else if (error){
            this.error = error;
        }
    }

    updateSelectedText(event){
        this.selectedRows = event.detail.selectedRows;
        console.log(JSON.stringify(event.detail));
    }
}