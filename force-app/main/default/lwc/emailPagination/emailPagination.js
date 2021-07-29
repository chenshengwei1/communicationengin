import { api, LightningElement,track } from 'lwc';

export default class EmailPagination extends LightningElement {

    @api
    _pageInfo;

    currentPage = 1;

    pageSize = 10;
    
    @api
    total;

    pageOptions = [{label:'5', value:5},{label:'10', value:10},{label:'20', value:20},{label:'50', value:50}];

    
    set pageInfo(value){
        this._pageInfo = value;
        this.currentPage = value.currentPage;
    }

    @api
    setOptions(value){
        if (!value) {
            this.pageOptions = [{label:'5', value:5},{label:'10', value:10},{label:'20', value:20},{label:'50', value:50}];
        }else if(Array.isArray(value)){
            this.pageOptions = value.map(e=>{
                return {label:e, value:Number(e)?Number(e):5};
            });
        }
    }

    @api
    get pageInfo(){
        return this._pageInfo;
    }

    get totalRecord(){
        if(!this.total){
            return 0;
        }
        return this.total ? this.total: 0;
    }

    turnPageSize(event){
        event.preventDefault();
        this.go(this.currentPage, event.detail.value);
        
    }


    gotoPrevious(event){
        event.preventDefault();
        this.go(this.currentPage - 1);
    }

    gotoNext(event){
        event.preventDefault();
        this.go(this.currentPage + 1);
    }
    
    gotoRecord(event){
        event.preventDefault();
        this.go(event.detail.value);
    }
    
    go(currentPage, pageSize){
        let oldPage = this.currentPage;
        if (pageSize) {
            this.pageSize = Number(pageSize) ?　Number(pageSize) : 10;
        }
        currentPage = Number(currentPage) ? Number(currentPage) : 1;
        if (currentPage < 1) {
            currentPage = 1;
        }

        let totalPage = Math.floor((this.totalRecord / this.pageSize)) + 1; 
        if (this.totalRecord % this.pageSize==0){
            totalPage = Math.floor((this.totalRecord / this.pageSize));
        }
        
        if (currentPage > totalPage) {
            currentPage = totalPage;
        }
        this.currentPage = currentPage;

        this.dispatchEvent(new CustomEvent('pagechange', {
            detail:{
                pageSize:this.pageSize,
                currentPage:this.currentPage,
                start:(this.currentPage - 1) * this.pageSize
            }
        }))
    }
}