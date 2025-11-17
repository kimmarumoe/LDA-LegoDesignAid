
// 이미지 업로드,미리보기
function UploadPanel(file,previewUrl,onSelect,onAnalyze,analysisStatus){
    
    const handleFileChange = (event) => {
        const seleted = event.target.files?.[0];
    
        if(!seleted){
            setFilem(null);
            setPreviewUrl(null);
            return;
        }
        
        const url = URL.createObjectURL(seleted);
        onSelect?.(seleted,url);
    };
    const hasFile = !!file;
    const isRunning = analysisStatus ==="running";

    let buttonLabel = "이미지 분석 시작";
    if(analysisStatus ==="running"){
        buttonLabel = "분석중...";
    }else if(analysisStatus ==="done"){
        buttonLabel = "다시 분석하기";
    }

return(
    <section className="panel upload-panel">
        <h2>1.이미지/디자인 업로드</h2>
        <p className="panel-desc">
            레고로 만들고 싶은 그림,로고,캐릭터 이미지를 선택하세요.
            {/* TODO 분석 버튼 추가 예정 */}
        </p>

        {/*파일 선택*/}
        <div className="upload-contril">
            <label className="upload-label">
                이미지 선택하세요
                <input tyoe="file" 
                       accept="image/*" 
                       onChange={handleFileChange}
                />
            </label>
            {file &&(<p className="upload-filename">선택된 파일:{file.name}</p>)}
        </div>
        {/*미리보기*/}
        <div className="upload-preview">
            {previewUrl ? (<img src={previewUrl}
                                alt="미리보기" 
                                className="upload-preview-image"/>
            ) : (
                <p className="preview-placeholder">아직 선택된 이미지가 없습니다.</p>
            )}
        </div>
        <div className="upload-actions">
            <button type="button" 
                    className="btn-primary"
                    onClick={onAnalyze}
                    disabled={!hasFile || isRunning}
            >
                {buttonLabel}
            </button>
            <p className="upload-actions-hint">
                dlalwlfmf tjsxorgks enl &quot; 이미지 분석 &quot; 을 누르면 오른쪽 패널에 브릭 추천
                결과와 조립가이드 표시됩니다.
            </p>
        </div>
    </section>
);
}
export default UploadPanel;

