public with sharing class ce_DmsAttachmentController {
    

    @AuraEnabled(cacheable=true)
    public static DownloadReponseInfo download(ce_DmsAttachment param) {
        System.debug('ce_DmsAttachmentController.download.param=' + param);
        DownloadReponseInfo resp = new DownloadReponseInfo();
        Blob fileContent = null;
        try{
            fileContent = com_DMSController.ceDownload(param.fileId, param.fileVersion);
            resp.fileContent = fileContent;
            resp.status = '0';
        }catch(Exception e){
            fileContent = null;
            resp.message = e.getMessage();
            resp.status = '1';
        }
        return resp;
    }

    @AuraEnabled(cacheable=true)
    public static UploadReponseInfo upload(String fileName, String fileContent) {
        System.debug('ce_DmsAttachmentController.upload.param=' + fileName + ', fileContent=' + fileContent);
        UploadReponseInfo resp = new UploadReponseInfo();
        if (fileName == null){
            resp.message = 'File name is empty.';
            resp.status = '1';
            return resp;
        }
        if (fileContent == null){
            resp.message = 'File content is empty.';
            resp.status = '1';
            return resp;
        }
        try {
            string fileContentBase64 = EncodingUtil.base64Encode(Blob.valueOf(fileContent)); 
            com_DMSController.ceUploadFile(fileName, fileContentBase64, 'true', 'true');
            resp.status = '0';
            System.debug('ce_DmsAttachmentController.upload success');
        }catch(Exception e){
            fileContent = null;
            resp.message = e.getMessage();
            resp.status = '1';
            System.debug('ce_DmsAttachmentController.upload error=' + e);
        }
        return resp;
    }

    public class UploadReponseInfo {
        @AuraEnabled public String status                  {get; set;}
        @AuraEnabled public String message                 {get; set;}
        @AuraEnabled public String fileId                  {get; set;}
    }

    public class DownloadReponseInfo {
        @AuraEnabled public String status                  {get; set;}
        @AuraEnabled public String message                 {get; set;}
        @AuraEnabled public Blob fileContent               {get; set;}
    }
}

