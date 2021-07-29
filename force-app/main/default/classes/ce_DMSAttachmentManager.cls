public with sharing class ce_DMSAttachmentManager {

    private static Map<String, AttachmentWrapper> ATTACHMENTADAPTER = new Map<String, AttachmentWrapper>();

    public static String currentAccount() {
        return 'COM';
    }

    public interface AttachmentWrapper {
        Blob download(ce_DmsAttachment param);
    }


    private static AttachmentWrapper getWrapper(){
        if (ATTACHMENTADAPTER.isEmpty()){
            ATTACHMENTADAPTER.put('COM', new COMAttachmentWrapper());
        }
        return ATTACHMENTADAPTER.get(currentAccount());
    }

    public class COMAttachmentWrapper {
        Blob download(ce_DmsAttachment param){
            return com_DMSController.ceDownload(param.fileId, param.fileVersion);
        }

        String upload(String fileName, String fileContent){
            return com_DMSController.ceUploadFile(fileName, fileContent, 'true', 'true');
        }
    }

    public class DefaultAttachmentWrapper {
        Blob download(ce_DmsAttachment param){
            return null;
        }

        String upload(String fileName, String fileContent){
            return null;
        }
    }
}
