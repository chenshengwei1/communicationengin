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

    pageSize = 10;
    start = 0;
    totalRecord = 0;
    name = '';

    @track
    templateList = [];

    @api
    forderNames = [];

    @wire(getEmailTemplates, {offset:'$start', limits:'$pageSize', filterVar:'$name', folderNames:'$forderNames'})
    wire_allContacts({error, data}){
        this.templateList = [];
        if (data){
            data.result.forEach(e=>{
                this.templateList.push(JSON.parse(JSON.stringify(e)));
            });
            this.totalRecord = data.count;
        }else if (error){
            this.error = error;
        }
    }



    search(event){
        this.name =  event.detail.value;
    }

    updateSelectedText(event){
        this.selectedRows = event.detail.selectedRows;
    }

    changePage(event){
        this.pageSize =  event.detail.pageSize;
        this.start = event.detail.start;
    }
}