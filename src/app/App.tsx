import { useState } from 'react';
import { Sparkles, ChevronLeft, ArrowRight, Printer, Trash2, LogIn, Shield, Search, CheckCircle, RefreshCw, ClipboardList, CheckSquare, Square, Sliders } from 'lucide-react';
import perfumeImgUrl from '../assets/perfume_hunmin_v3.png';
import { analyzeName } from '../logic/analyzeName';
import { recommendPerfumes } from '../logic/recommendPerfume';
import { NameAnalysis, PerfumeRecipe, SejongStory, FinalRecipe, RecommendedNote } from '../types/perfume';
import { SEJONG_STORIES } from '../data/sejongStories';
import { SURVEY_QUESTIONS } from '../data/surveyQuestions';
import { NOTES } from '../data/notes';
import { dbLoginGuest, dbCreateRecord, dbGetRecords, dbCompleteRecord, dbDeleteRecords } from '../logic/supabaseClient';

export default function App() {
  // 전체 플로우 상태: 'input' | 'mypage' | 'sejong' | 'survey' | 'result' | 'submit_done' | 'record'
  const [step, setStep] = useState<'input' | 'mypage' | 'sejong' | 'survey' | 'result' | 'submit_done' | 'record'>('input');
  
  // 인증 관련 상태
  const [loginId, setLoginId] = useState(''); // 휴대폰 번호 뒷자리 4자리 + 영문 1자리
  const [passwordAdmin, setPasswordAdmin] = useState(''); // 관리자용 2차 패스워드
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // 일반 손님 의뢰용 상태
  const [guestNameForRecipe, setGuestNameForRecipe] = useState(''); // 의뢰인 성함 (대리조향 가능)
  const [nameError, setNameError] = useState('');

  // 일반 손님 마이페이지 상태
  const [guestRecords, setGuestRecords] = useState<FinalRecipe[]>([]);
  const [isRecordsLoading, setIsRecordsLoading] = useState(false);

  // 관리자 대시보드 상태
  const [adminRecords, setAdminRecords] = useState<FinalRecipe[]>([]);
  const [adminSearchTerm, setAdminSearchTerm] = useState('');
  const [adminActiveTab, setAdminActiveTab] = useState<'all' | 'submitted' | 'completed'>('all'); // 통합 대시보드 필터
  const [selectedRecordForAdmin, setSelectedRecordForAdmin] = useState<FinalRecipe | null>(null);

  // 관리자 일괄 선택 삭제 대상 ID 리스트
  const [selectedAdminRecordIds, setSelectedAdminRecordIds] = useState<string[]>([]);

  // 1~3단계 진행용 임시 상태
  const [analysis, setAnalysis] = useState<NameAnalysis | null>(null);
  const [selectedStory, setSelectedStory] = useState<SejongStory | null>(null);
  const [surveyAnswers, setSurveyAnswers] = useState<{ questionId: number; optionId: number }[]>([]);
  const [currentSurveyIdx, setCurrentSurveyIdx] = useState(0);

  // 4단계 추천 결과 상태
  const [recommended1, setRecommended1] = useState<PerfumeRecipe | null>(null);
  const [recommended2, setRecommended2] = useState<PerfumeRecipe | null>(null);
  const [selectedRecipeType, setSelectedRecipeType] = useState<'name_only' | 'name_sejong' | null>(null);

  // 손님용 4단계 최종 커스터마이저 조향 상태
  const [guestTop, setGuestTop] = useState<RecommendedNote[]>([]);
  const [guestMiddle, setGuestMiddle] = useState<RecommendedNote[]>([]);
  const [guestBase, setGuestBase] = useState<RecommendedNote[]>([]);
  const [selectedGuestTopToAdd, setSelectedGuestTopToAdd] = useState('');
  const [selectedGuestMiddleToAdd, setSelectedGuestMiddleToAdd] = useState('');
  const [selectedGuestBaseToAdd, setSelectedGuestBaseToAdd] = useState('');

  // 4단계 조향사 수정용 임시 상태
  const [finalTop, setFinalTop] = useState<RecommendedNote[]>([]);
  const [finalMiddle, setFinalMiddle] = useState<RecommendedNote[]>([]);
  const [finalBase, setFinalBase] = useState<RecommendedNote[]>([]);
  const [addedNotesText, setAddedNotesText] = useState('');
  const [removedNotesText, setRemovedNotesText] = useState('');
  const [modifiedNotesText, setModifiedNotesText] = useState('');
  const [makerMemo, setMakerMemo] = useState('');
  const [finalPerfumeName, setFinalPerfumeName] = useState('');
  const [selectedTopToAdd, setSelectedTopToAdd] = useState('');
  const [selectedMiddleToAdd, setSelectedMiddleToAdd] = useState('');
  const [selectedBaseToAdd, setSelectedBaseToAdd] = useState('');

  // 5단계 최종 확정 레시피
  const [finalRecipe, setFinalRecipe] = useState<FinalRecipe | null>(null);

  // 관리자 모드 레코드 목록 실시간 리로딩용
  const loadAdminRecords = async () => {
    try {
      const records = await dbGetRecords('admin9');
      setAdminRecords(records);
    } catch (err) {
      console.error('관리자 기록 로드 실패:', err);
    }
  };

  // 일반 손님 기록 리로딩용
  const loadGuestRecords = async (id: string) => {
    setIsRecordsLoading(true);
    try {
      const records = await dbGetRecords(id);
      setGuestRecords(records);
    } catch (err) {
      console.error('손님 기록 로드 실패:', err);
    } finally {
      setIsRecordsLoading(false);
    }
  };

  // 로그인 및 인증 핸들러
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const idTrimmed = loginId.trim();

    if (!idTrimmed) {
      setAuthError('로그인 코드를 입력해주세요.');
      return;
    }

    // 관리자 마스터 로그인 체크 (admin9 or admin)
    if (idTrimmed.toLowerCase() === 'admin9' || idTrimmed.toLowerCase() === 'admin') {
      if (!passwordAdmin) {
        setAuthError('관리자 비밀번호를 입력해주세요.');
        return;
      }
      if (passwordAdmin !== '9999') {
        setAuthError('비밀번호가 일치하지 않습니다.');
        return;
      }

      setIsAuthLoading(true);
      try {
        setIsAdmin(true);
        setIsLoggedIn(true);
        setStep('mypage'); // 관리자는 보관소 대시보드로 진입
        await loadAdminRecords();
      } catch (err) {
        setAuthError('관리자 데이터를 불러오는 데 실패했습니다.');
      } finally {
        setIsAuthLoading(false);
      }
      return;
    }

    // 일반 로그인 코드 유효성 검사 (휴대폰 뒷자리 4개 + 영문 1자)
    const loginRegEx = /^\d{4}[a-zA-Z]$/;
    if (!loginRegEx.test(idTrimmed)) {
      setAuthError('휴대폰 뒷자리 4개와 영문 1글자를 입력해주세요. (예: 1234a)');
      return;
    }

    setIsAuthLoading(true);
    try {
      const res = await dbLoginGuest(idTrimmed);
      if (!res.success) {
        setAuthError(res.error || '로그인 인증 실패');
        setIsAuthLoading(false);
        return;
      }

      setIsLoggedIn(true);
      setLoginId(idTrimmed); // Ensure sanitized loginId is saved to state
      // 로그인 후 즉시 이름 적는 1단계 화면으로 이행
      setStep('input');
      setGuestNameForRecipe('');
    } catch (err) {
      setAuthError('로그인 처리 중 에러가 발생했습니다.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  // 로그아웃
  const handleLogout = () => {
    setLoginId('');
    setPasswordAdmin('');
    setIsLoggedIn(false);
    setIsAdmin(false);
    setGuestRecords([]);
    setAdminRecords([]);
    setSelectedAdminRecordIds([]);
    setSelectedRecordForAdmin(null);
    setAnalysis(null);
    setSelectedStory(null);
    setSurveyAnswers([]);
    setRecommended1(null);
    setRecommended2(null);
    setSelectedRecipeType(null);
    setFinalRecipe(null);
    setGuestNameForRecipe('');
    setNameError('');
    setStep('input');
  };

  // 1단계 이름 입력 완료 -> 감성 분석 진행 및 2단계 이동 (Guest)
  const handleNameNext = (e: React.FormEvent) => {
    e.preventDefault();
    setNameError('');
    const trimmedName = guestNameForRecipe.trim();
    
    if (!trimmedName) {
      setNameError('이름을 입력해주세요.');
      return;
    }
    if (!/^[가-힣]+$/.test(trimmedName)) {
      setNameError('공백 없는 한글 이름만 입력 가능합니다.');
      return;
    }
    if (trimmedName.length < 2 || trimmedName.length > 5) {
      setNameError('이름은 2자에서 5자 사이로 입력해주세요.');
      return;
    }

    setIsAuthLoading(true);
    try {
      const nameAnalysis = analyzeName(trimmedName);
      setAnalysis(nameAnalysis);
      setTimeout(() => {
        setIsAuthLoading(false);
        setStep('sejong');
      }, 600);
    } catch (err) {
      alert(err instanceof Error ? err.message : '이름 분석 오류');
      setIsAuthLoading(false);
    }
  };

  // 2단계 완료 -> 3단계 이동
  const handleSejongSubmit = () => {
    if (!selectedStory) {
      alert('세종의 이야기를 하나 선택해주세요.');
      return;
    }
    setStep('survey');
    setCurrentSurveyIdx(0);
    setSurveyAnswers([]);
  };

  // 3단계 설문 응답 처리
  const handleSurveyAnswer = (optionId: number) => {
    const questionId = SURVEY_QUESTIONS[currentSurveyIdx].id;
    const newAnswers = [...surveyAnswers.filter(a => a.questionId !== questionId), { questionId, optionId }];
    setSurveyAnswers(newAnswers);

    if (currentSurveyIdx < SURVEY_QUESTIONS.length - 1) {
      setCurrentSurveyIdx(currentSurveyIdx + 1);
    } else {
      if (analysis) {
        const { recipe1, recipe2 } = recommendPerfumes(analysis, selectedStory, newAnswers);
        setRecommended1(recipe1);
        setRecommended2(recipe2);
        setStep('result');
        setSelectedRecipeType(null);
      }
    }
  };

  // 손님이 4단계에서 추천 테마 선택 시 조향 복사 처리
  const handleSelectRecipeType = (type: 'name_only' | 'name_sejong') => {
    setSelectedRecipeType(type);
    const targetRecipe = type === 'name_only' ? recommended1 : recommended2;
    if (targetRecipe) {
      setGuestTop(JSON.parse(JSON.stringify(targetRecipe.top)));
      setGuestMiddle(JSON.parse(JSON.stringify(targetRecipe.middle)));
      setGuestBase(JSON.parse(JSON.stringify(targetRecipe.base)));
    }
  };

  // 손님용 조향 추가
  const handleGuestAddNote = (category: 'top' | 'middle' | 'base', noteId: string) => {
    if (!noteId) return;
    const noteObj = NOTES.find(n => n.id === noteId);
    if (!noteObj) return;

    const list = category === 'top' ? guestTop : category === 'middle' ? guestMiddle : guestBase;
    if (list.some(item => item.note.id === noteId)) {
      alert('이미 추가된 향료입니다.');
      return;
    }

    const newItem: RecommendedNote = { note: noteObj, ratio: 10, reason: '손님 직접 추가' };
    if (category === 'top') {
      setGuestTop([...guestTop, newItem]);
      setSelectedGuestTopToAdd('');
    } else if (category === 'middle') {
      setGuestMiddle([...guestMiddle, newItem]);
      setSelectedGuestMiddleToAdd('');
    } else {
      setGuestBase([...guestBase, newItem]);
      setSelectedGuestBaseToAdd('');
    }
  };

  // 손님용 조향 삭제
  const handleGuestRemoveNote = (category: 'top' | 'middle' | 'base', index: number) => {
    if (category === 'top') {
      setGuestTop(guestTop.filter((_, idx) => idx !== index));
    } else if (category === 'middle') {
      setGuestMiddle(guestMiddle.filter((_, idx) => idx !== index));
    } else {
      setGuestBase(guestBase.filter((_, idx) => idx !== index));
    }
  };

  // 손님용 조향 비율 수정
  const handleGuestRatioChange = (category: 'top' | 'middle' | 'base', index: number, ratio: number) => {
    const val = isNaN(ratio) ? 0 : Math.max(0, Math.min(100, ratio));
    if (category === 'top') {
      const updated = [...guestTop];
      updated[index].ratio = val;
      setGuestTop(updated);
    } else if (category === 'middle') {
      const updated = [...guestMiddle];
      updated[index].ratio = val;
      setGuestMiddle(updated);
    } else {
      const updated = [...guestBase];
      updated[index].ratio = val;
      setGuestBase(updated);
    }
  };

  // 추천 향 선택하여 조향 의뢰서 최종 제출
  const handleGuestSubmitRecipe = async () => {
    if (!selectedRecipeType) return;
    const targetRecipe = selectedRecipeType === 'name_only' ? recommended1 : recommended2;
    if (!targetRecipe || !analysis) return;

    // 손님이 수정한 최종 비율의 합 검증
    const totalRatio = [...guestTop, ...guestMiddle, ...guestBase].reduce((sum, item) => sum + (item.ratio || 0), 0);
    if (totalRatio !== 100) {
      alert(`향료 비율의 합계가 100%가 되어야 제출이 가능합니다. (현재: ${totalRatio}%)`);
      return;
    }

    setIsAuthLoading(true);
    try {
      const mockFinalRecipe: Partial<FinalRecipe> = {
        selectedType: selectedRecipeType,
        perfumeName: guestNameForRecipe + '의 향',
        top: guestTop,
        middle: guestMiddle,
        base: guestBase,
        addedNotes: [],
        removedNotes: [],
        modifiedNotes: [],
        makerMemo: '',
        analysis: analysis,
        selectedStory: selectedStory,
        surveyAnswers: surveyAnswers
      };

      await dbCreateRecord(guestNameForRecipe.trim(), loginId, mockFinalRecipe);
      await loadGuestRecords(loginId); // Prefetch records to sync MyPage state
      setStep('submit_done');
    } catch (err) {
      alert('의뢰 제출 중 오류가 발생했습니다.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  // 관리자 의뢰 클릭 시 폼 정보 로드
  const handleSelectAdminRecord = (record: FinalRecipe) => {
    setSelectedRecordForAdmin(record);
    setFinalTop(JSON.parse(JSON.stringify(record.top)));
    setFinalMiddle(JSON.parse(JSON.stringify(record.middle)));
    setFinalBase(JSON.parse(JSON.stringify(record.base)));
    setFinalPerfumeName(record.perfumeName || record.guestName + '의 향');
    setAddedNotesText(record.addedNotes?.join(', ') || '');
    setRemovedNotesText(record.removedNotes?.join(', ') || '');
    setModifiedNotesText(record.modifiedNotes?.join(', ') || '');
    setMakerMemo(record.makerMemo || '');
  };

  // 조향사 향료 추가
  const handleAddNote = (category: 'top' | 'middle' | 'base', noteId: string) => {
    if (!noteId) return;
    const noteObj = NOTES.find(n => n.id === noteId);
    if (!noteObj) return;

    const list = category === 'top' ? finalTop : category === 'middle' ? finalMiddle : finalBase;
    if (list.some(item => item.note.id === noteId)) {
      alert('이미 추가된 향료입니다.');
      return;
    }

    const newItem: RecommendedNote = { note: noteObj, ratio: 10, reason: '조향사 수동 추가' };
    if (category === 'top') {
      setFinalTop([...finalTop, newItem]);
      setSelectedTopToAdd('');
    } else if (category === 'middle') {
      setFinalMiddle([...finalMiddle, newItem]);
      setSelectedMiddleToAdd('');
    } else {
      setFinalBase([...finalBase, newItem]);
      setSelectedBaseToAdd('');
    }
  };

  // 조향사 향료 삭제
  const handleRemoveNote = (category: 'top' | 'middle' | 'base', index: number) => {
    if (category === 'top') {
      setFinalTop(finalTop.filter((_, idx) => idx !== index));
    } else if (category === 'middle') {
      setFinalMiddle(finalMiddle.filter((_, idx) => idx !== index));
    } else {
      setFinalBase(finalBase.filter((_, idx) => idx !== index));
    }
  };

  // 조향사 비율 수정
  const handleRatioChange = (category: 'top' | 'middle' | 'base', index: number, ratio: number) => {
    const val = isNaN(ratio) ? 0 : Math.max(0, Math.min(100, ratio));
    if (category === 'top') {
      const updated = [...finalTop];
      updated[index].ratio = val;
      setFinalTop(updated);
    } else if (category === 'middle') {
      const updated = [...finalMiddle];
      updated[index].ratio = val;
      setFinalMiddle(updated);
    } else {
      const updated = [...finalBase];
      updated[index].ratio = val;
      setFinalBase(updated);
    }
  };

  // 조향사 확정 ➔ A6 인쇄 화면 진입
  const handleConfirmAdminRecipe = async () => {
    if (!selectedRecordForAdmin) return;

    const totalRatio = [...finalTop, ...finalMiddle, ...finalBase].reduce((sum, item) => sum + (item.ratio || 0), 0);
    if (totalRatio !== 100) {
      if (!window.confirm(`현재 향료 비율의 합이 ${totalRatio}%입니다. 그대로 완료하시겠습니까?`)) {
        return;
      }
    }

    setIsAuthLoading(true);
    try {
      const updates: Partial<FinalRecipe> = {
        top: finalTop,
        middle: finalMiddle,
        base: finalBase,
        addedNotes: addedNotesText.split(',').map(s => s.trim()).filter(Boolean),
        removedNotes: removedNotesText.split(',').map(s => s.trim()).filter(Boolean),
        modifiedNotes: modifiedNotesText.split(',').map(s => s.trim()).filter(Boolean),
        perfumeName: finalPerfumeName.trim(),
        makerMemo: makerMemo.trim(),
        selectedType: selectedRecordForAdmin.selectedType
      };

      await dbCompleteRecord(selectedRecordForAdmin.id, updates);
      
      const updatedRecipe: FinalRecipe = {
        ...selectedRecordForAdmin,
        ...updates,
        createdDate: selectedRecordForAdmin.createdDate
      };
      
      setFinalRecipe(updatedRecipe);
      await loadAdminRecords(); // 관리자 목록 리로딩
      setSelectedRecordForAdmin(null);
      setStep('record'); // 인쇄로 이동
    } catch (err) {
      alert('레시피 저장 중 오류가 발생했습니다.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  // 관리자 일괄 선택 삭제
  const handleBatchDeleteRecords = async () => {
    if (selectedAdminRecordIds.length === 0) return;
    if (!window.confirm(`선택한 ${selectedAdminRecordIds.length}개의 상담 기록을 영구 삭제하시겠습니까?`)) return;

    try {
      await dbDeleteRecords(selectedAdminRecordIds);
      setSelectedAdminRecordIds([]);
      await loadAdminRecords();
      if (selectedRecordForAdmin && selectedAdminRecordIds.includes(selectedRecordForAdmin.id)) {
        setSelectedRecordForAdmin(null);
      }
    } catch (err) {
      alert('선택 삭제 중 오류가 발생했습니다.');
    }
  };

  // 개별 체크박스 토글
  const handleToggleRecordSelect = (id: string) => {
    if (selectedAdminRecordIds.includes(id)) {
      setSelectedAdminRecordIds(selectedAdminRecordIds.filter(item => item !== id));
    } else {
      setSelectedAdminRecordIds([...selectedAdminRecordIds, id]);
    }
  };

  // 전체 선택 토글
  const handleToggleAllSelect = (recordsOnView: FinalRecipe[]) => {
    const recordIdsOnView = recordsOnView.map(r => r.id);
    const allSelected = recordIdsOnView.every(id => selectedAdminRecordIds.includes(id));

    if (allSelected) {
      // 해당 필터 목록 ID들 모두 해제
      setSelectedAdminRecordIds(selectedAdminRecordIds.filter(id => !recordIdsOnView.includes(id)));
    } else {
      // 해당 필터 목록 ID들 모두 추가
      const newSelected = Array.from(new Set([...selectedAdminRecordIds, ...recordIdsOnView]));
      setSelectedAdminRecordIds(newSelected);
    }
  };

  // 신규 향수 만들기 시작 (이전 진행 데이터 리셋 후 세종의 이야기로)
  const handleStartNewJourney = () => {
    setSelectedStory(null);
    setSurveyAnswers([]);
    setRecommended1(null);
    setRecommended2(null);
    setSelectedRecipeType(null);
    setGuestNameForRecipe('');
    setNameError('');
    setStep('input'); // 로그인된 상태에서 1단계(이름 입력)로 이동
  };

  // 마이페이지(과거기록서) 이동 전 기록 fetch
  const handleGoToMyPage = async () => {
    setStep('mypage');
    await loadGuestRecords(loginId);
  };

  const currentTotalRatio = [...finalTop, ...finalMiddle, ...finalBase].reduce((sum, item) => sum + (item.ratio || 0), 0);
  const guestTotalRatio = [...guestTop, ...guestMiddle, ...guestBase].reduce((sum, item) => sum + (item.ratio || 0), 0);

  // 관리자 목록 필터링 (통합 탭 지원)
  const filteredAdminRecords = adminRecords.filter(r => {
    const recordStatus = (r as any).status || (r.makerMemo ? 'completed' : 'submitted');
    const statusOk = adminActiveTab === 'all' ? true : (recordStatus === adminActiveTab);

    const query = adminSearchTerm.trim().toLowerCase();
    const nameOk = r.guestName.toLowerCase().includes(query) || r.perfumeName.toLowerCase().includes(query);
    return statusOk && nameOk;
  });

  const isMasterLogin = loginId.trim().toLowerCase() === 'admin9' || loginId.trim().toLowerCase() === 'admin';

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-forest-100 print:bg-white print:min-h-0">
      
      {/* Header - 인쇄 시 미출력 */}
      <div className="print-exclude flex justify-between items-center bg-forest-950 px-6 py-4 text-white">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-luxury-gold" />
          <span className="font-serif font-bold tracking-[0.15em] text-sm md:text-base">훈민향음 (訓民香音)</span>
        </div>
        {isLoggedIn && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-forest-300 font-medium">
              {isAdmin ? '조향사(관리자)' : `로그인 코드: ${loginId}`}
            </span>
            <button 
              onClick={handleLogout}
              className="px-3 py-1 bg-forest-800 text-luxury-cream text-[10px] rounded hover:bg-forest-700 transition-colors"
            >
              로그아웃
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center py-10 px-4 bg-luxury-cream/10 print:py-0 print:px-0 print:bg-white">
        
        {/* 1단계 이전: 로그인 ID 입력 */}
        {!isLoggedIn && (
          <div className="max-w-5xl xl:max-w-6xl w-full grid lg:grid-cols-2 grid-cols-1 gap-8 lg:gap-12 items-center print-exclude">
            {/* Visual branding block */}
            <div className="text-center md:text-left space-y-6 md:pr-6 animate-slide-up">
              <div className="inline-block px-3 py-1 rounded-full border border-forest-200 text-[11px] font-semibold tracking-widest text-forest-600 uppercase bg-forest-50/50">
                조향사 상담 플로우 - 로그인
              </div>
              <h1 className="font-serif text-4xl md:text-6xl font-bold leading-tight text-forest-950">
                훈민향음<br />
                <span className="text-forest-700 font-medium text-2xl md:text-3xl font-serif">(訓民香音)</span>
              </h1>
              <p className="text-sm md:text-base leading-relaxed text-forest-600 font-medium">
                세종대왕이 훈민정음으로 백성의 뜻을 담아냈듯,<br className="hidden md:inline" />
                조향사와의 대화를 거쳐 당신의 이름과 이야기를 하나의 특별한 향으로 완성합니다.
              </p>
              
              <div className="hidden md:flex justify-center md:justify-start pt-4 relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-luxury-gold to-forest-500 rounded-2xl blur opacity-15 group-hover:opacity-25 transition duration-1000 group-hover:duration-200"></div>
                <img 
                  src={perfumeImgUrl} 
                  alt="훈민향음 향수" 
                  className="relative w-full max-w-lg h-72 md:h-80 object-cover rounded-2xl drop-shadow-2xl hover:scale-[1.02] transition-transform duration-500" 
                />
              </div>
            </div>

            {/* Login form block */}
            <div className="bg-white border border-luxury-gold/15 rounded-2xl p-8 shadow-xl flex flex-col justify-center space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-forest-50 to-transparent opacity-50 -z-10 rounded-tr-2xl"></div>
              
              <div className="text-center md:text-left space-y-2">
                <span className="text-[10px] tracking-widest text-luxury-goldDark font-serif uppercase block">Login Code</span>
                <h2 className="font-serif text-2xl font-bold text-forest-950">조향 의뢰 로그인</h2>
                <p className="text-xs text-forest-500">
                  휴대폰 번호 뒷자리 4자리와 원하는 영문 1글자를 조합해 입력해주세요.<br />
                  (예: 1234a)
                </p>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-forest-700 uppercase mb-1">나의 로그인 코드</label>
                  <input 
                    type="text" 
                    maxLength={10}
                    value={loginId}
                    onChange={(e) => {
                      setLoginId(e.target.value);
                      if (authError) setAuthError('');
                    }}
                    placeholder="예: 1234a"
                    disabled={isAuthLoading}
                    className="w-full px-4 py-3 bg-luxury-cream border border-forest-200 rounded-lg text-sm text-forest-900 placeholder-forest-300 focus:outline-none focus:border-forest-600 focus:ring-1 focus:ring-forest-600 text-center text-lg font-bold tracking-widest"
                  />
                </div>

                {/* 관리자(admin9)일 때 비밀번호 2차 검증 필드 페이드인 */}
                {isMasterLogin && (
                  <div className="space-y-1 animate-slide-up">
                    <label className="block text-[10px] font-bold text-red-700 uppercase mb-1">관리자 비밀번호 (Password)</label>
                    <input 
                      type="password"
                      value={passwordAdmin}
                      onChange={(e) => {
                        setPasswordAdmin(e.target.value);
                        if (authError) setAuthError('');
                      }}
                      placeholder="관리자 비밀번호 4자리 입력"
                      className="w-full px-4 py-3 bg-red-50/30 border border-red-200 rounded-lg text-sm text-red-950 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 text-center text-lg font-bold tracking-widest"
                    />
                  </div>
                )}

                {authError && (
                  <p className="text-xs text-red-600 font-semibold text-center">{authError}</p>
                )}

                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-forest-800 hover:bg-forest-900 text-luxury-cream font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {isAuthLoading ? (
                    <div className="w-5 h-5 border-2 border-luxury-cream border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 text-luxury-gold" />
                      <span>입장하기</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 1단계: 나를 읽다 (이름 입력 - 로그인 직후 진입) */}
        {step === 'input' && isLoggedIn && !isAdmin && (
          <div className="max-w-5xl xl:max-w-6xl w-full grid lg:grid-cols-2 grid-cols-1 gap-8 lg:gap-12 items-center print-exclude">
            <div className="text-center md:text-left space-y-6 md:pr-6 animate-slide-up">
              <div className="flex flex-col md:flex-row md:items-center gap-3 justify-center md:justify-start">
                <div className="inline-block px-3 py-1 rounded-full border border-forest-200 text-[11px] font-semibold tracking-widest text-forest-600 uppercase bg-forest-50/50">
                  조향사 상담 플로우 - 1단계
                </div>
                <button
                  onClick={handleGoToMyPage}
                  className="text-xs font-bold text-luxury-goldDark hover:underline flex items-center gap-1 justify-center"
                >
                  <ClipboardList className="w-3.5 h-3.5" /> 나의 과거 기록서 보기
                </button>
              </div>
              <h1 className="font-serif text-4xl md:text-6xl font-bold leading-tight text-forest-950">
                훈민향음<br />
                <span className="text-forest-700 font-medium text-2xl md:text-3xl font-serif">(訓民香音)</span>
              </h1>
              <p className="text-sm md:text-base leading-relaxed text-forest-600 font-medium">
                의뢰하실 이름을 입력해 주세요. <br />
                가족, 친구 등 다른 사람들의 이름으로도 언제든 새로 향수를 조향할 수 있습니다.
              </p>
              
              <div className="hidden md:flex justify-center md:justify-start pt-4 relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-luxury-gold to-forest-500 rounded-2xl blur opacity-15 group-hover:opacity-25 transition duration-1000 group-hover:duration-200"></div>
                <img 
                  src={perfumeImgUrl} 
                  alt="훈민향음 향수" 
                  className="relative w-full max-w-lg h-72 md:h-80 object-cover rounded-2xl drop-shadow-2xl hover:scale-[1.02] transition-transform duration-500" 
                />
              </div>
            </div>
 
            <div className="bg-white border border-luxury-gold/15 rounded-2xl p-8 shadow-xl flex flex-col justify-center space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-forest-50 to-transparent opacity-50 -z-10 rounded-tr-2xl"></div>
              <div className="space-y-2 text-center md:text-left">
                <h3 className="font-serif text-lg font-semibold text-forest-900">의뢰 대상자 성함</h3>
                <p className="text-xs text-forest-500">향수를 소유할 분의 이름을 공백 없이 입력해주세요.</p>
              </div>

              <form onSubmit={handleNameNext} className="space-y-6">
                <div className="relative">
                  <label htmlFor="guestName" className="block text-xs font-semibold tracking-wider text-forest-700 uppercase mb-2">Guest Name (한글 이름)</label>
                  <input
                    type="text"
                    id="guestName"
                    value={guestNameForRecipe}
                    onChange={(e) => {
                      setGuestNameForRecipe(e.target.value);
                      if (nameError) setNameError('');
                    }}
                    placeholder="이름을 입력하세요 (예: 홍길동)"
                    disabled={isAuthLoading}
                    className="w-full px-5 py-4 bg-luxury-cream border border-forest-200 focus:border-forest-600 focus:ring-forest-100 rounded-lg text-forest-900 placeholder-forest-300 focus:outline-none focus:ring-4 transition-all duration-300 text-lg tracking-wide"
                  />
                  {nameError && (
                    <div className="flex items-center gap-1.5 mt-2.5 text-xs text-red-600 font-medium animate-fade-in">
                      <span>{nameError}</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="luxury-btn w-full flex items-center justify-center gap-2 px-6 py-4 bg-forest-800 text-luxury-cream font-medium rounded-lg hover:bg-forest-900 transition-all duration-300 shadow-md active:scale-[0.98] disabled:opacity-50"
                >
                  {isAuthLoading ? (
                    <div className="w-5 h-5 border-2 border-luxury-cream border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-luxury-gold" />
                      <span>이름 분석 및 조향 시작</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 2단계: 세종의 이야기 선택 */}
        {step === 'sejong' && isLoggedIn && (
          <div className="max-w-4xl w-full space-y-8 animate-slide-up print-exclude">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold tracking-widest text-luxury-goldDark uppercase">Step 02</span>
              <h2 className="font-serif text-3xl font-bold text-forest-950">세종의 이야기를 담다</h2>
              <p className="text-sm text-forest-600 max-w-lg mx-auto">
                이름 '{analysis?.normalizedName}'의 향에 녹여내고 싶은 세종대왕의 역사 속 이야기를 하나 선택해 주세요.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {SEJONG_STORIES.map((story) => {
                const isSelected = selectedStory?.id === story.id;
                return (
                  <button
                    key={story.id}
                    onClick={() => setSelectedStory(story)}
                    className={`text-left p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between h-64 bg-white relative overflow-hidden group hover:shadow-lg ${
                      isSelected 
                        ? 'border-luxury-gold ring-2 ring-luxury-gold/30 shadow-md' 
                        : 'border-luxury-gold/15 hover:border-forest-400'
                    }`}
                  >
                    <div className="absolute -bottom-8 -right-8 w-28 h-28 bg-luxury-cream/30 rounded-full group-hover:scale-110 transition-transform duration-500 -z-10"></div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="font-serif text-xs font-bold text-luxury-goldDark tracking-wider uppercase">
                          {story.title}
                        </span>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-forest-800 text-white flex items-center justify-center text-[10px] font-bold">
                            ✓
                          </span>
                        )}
                      </div>
                      <h3 className="font-serif text-xl font-bold text-forest-900 group-hover:text-forest-950 transition-colors">
                        {story.subtitle}
                      </h3>
                      <p className="text-xs text-forest-600 leading-relaxed font-medium line-clamp-4">
                        {story.description}
                      </p>
                    </div>

                    <div className="text-[10px] font-semibold text-forest-400 italic pt-2 border-t border-luxury-sand/50 w-full">
                      {story.imageDesc}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-4">
              <button 
                onClick={() => setStep('input')}
                className="flex items-center gap-1 text-sm font-bold text-forest-600 hover:text-forest-900"
              >
                <ChevronLeft className="w-4 h-4" /> 이전으로
              </button>
              <button
                onClick={handleSejongSubmit}
                disabled={!selectedStory}
                className="luxury-btn flex items-center gap-1.5 px-6 py-3 bg-forest-800 text-luxury-cream rounded-xl text-sm font-semibold hover:bg-forest-900 disabled:opacity-50"
              >
                <span>향 선호도 설문으로</span> <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* 3단계: 향선택 설문 */}
        {step === 'survey' && isLoggedIn && (
          <div className="max-w-2xl w-full space-y-8 animate-slide-up print-exclude">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-semibold text-forest-500">
                <span>향 선호도 설문</span>
                <span>{currentSurveyIdx + 1} / {SURVEY_QUESTIONS.length}</span>
              </div>
              <div className="w-full h-1.5 bg-luxury-sand rounded-full overflow-hidden">
                <div 
                  className="h-full bg-luxury-gold transition-all duration-300"
                  style={{ width: `${((currentSurveyIdx + 1) / SURVEY_QUESTIONS.length) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-white border border-luxury-gold/15 rounded-2xl p-8 shadow-xl space-y-6">
              <div className="text-center space-y-2">
                <span className="text-[10px] tracking-widest text-luxury-goldDark font-serif uppercase">Step 03</span>
                <h3 className="font-serif text-xl font-bold text-forest-950">
                  {SURVEY_QUESTIONS[currentSurveyIdx].question}
                </h3>
              </div>

              <div className="space-y-3.5">
                {SURVEY_QUESTIONS[currentSurveyIdx].options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleSurveyAnswer(option.id)}
                    className="w-full text-left px-5 py-4 bg-luxury-cream/40 border border-luxury-gold/10 hover:border-forest-600 hover:bg-white rounded-xl transition-all text-sm font-medium text-forest-800 hover:text-forest-950 shadow-sm active:scale-[0.995]"
                  >
                    {option.text}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button 
                onClick={() => {
                  if (currentSurveyIdx > 0) {
                    setCurrentSurveyIdx(currentSurveyIdx - 1);
                  } else {
                    setStep('sejong');
                  }
                }}
                className="flex items-center gap-1 text-sm font-bold text-forest-600 hover:text-forest-900"
              >
                <ChevronLeft className="w-4 h-4" /> 이전으로
              </button>
            </div>
          </div>
        )}

        {/* 4단계: 향을 완성하다 (손님용 레시피 커스터마이저 탑재) */}
        {step === 'result' && isLoggedIn && (
          <div className="max-w-6xl w-full space-y-8 animate-slide-up print-exclude">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold tracking-widest text-luxury-goldDark uppercase">Step 04</span>
              <h2 className="font-serif text-3xl font-bold text-forest-950">당신의 향을 다듬다</h2>
              <p className="text-xs text-forest-600">
                두 가지 추천 제안 중 마음에 드는 안을 선택하고, 하단의 조향 편집기에서 직접 좋아하는 향료를 더하거나 뺄 수 있습니다.
              </p>
            </div>

            {/* 테마 추천 2안 그리드 */}
            <div className="grid md:grid-cols-2 gap-8 items-stretch">
              
              {/* 추천 1안 */}
              {recommended1 && (
                <div 
                  onClick={() => handleSelectRecipeType('name_only')}
                  className={`cursor-pointer bg-white border rounded-2xl p-6 md:p-8 flex flex-col justify-between space-y-6 transition-all duration-300 relative ${
                    selectedRecipeType === 'name_only'
                      ? 'border-luxury-gold ring-2 ring-luxury-gold/40 shadow-xl scale-[1.01]'
                      : 'border-luxury-gold/15 hover:border-forest-400 hover:shadow-md'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-forest-50 border border-forest-200 text-forest-700 font-bold uppercase tracking-wider">
                        추천 테마 01
                      </span>
                      <input 
                        type="radio" 
                        name="recipeSelect" 
                        checked={selectedRecipeType === 'name_only'} 
                        onChange={() => handleSelectRecipeType('name_only')}
                        className="w-4 h-4 text-forest-900 border-luxury-gold focus:ring-forest-800"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="font-serif text-2xl font-bold text-forest-950">나의 이름을 담은 향</h3>
                      <p className="text-[11px] text-forest-400 italic">이름 분석과 취향 설문을 결합한 고유의 무드</p>
                    </div>
                    <p className="text-xs leading-relaxed text-forest-600 pl-3 border-l-2 border-luxury-gold font-medium">
                      "{recommended1.concept}"
                    </p>

                    <div className="space-y-3 pt-2">
                      <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-semibold text-forest-800">
                        <div className="bg-forest-50/50 p-2.5 rounded-lg border border-forest-100">
                          <div className="text-[9px] text-forest-400 uppercase font-mono mb-1">Top</div>
                          {recommended1.top.map(item => item.note.nameKo || item.note.nameEn).join(', ')}
                        </div>
                        <div className="bg-forest-50/50 p-2.5 rounded-lg border border-forest-100">
                          <div className="text-[9px] text-forest-400 uppercase font-mono mb-1">Middle</div>
                          {recommended1.middle.map(item => item.note.nameKo || item.note.nameEn).join(', ')}
                        </div>
                        <div className="bg-forest-50/50 p-2.5 rounded-lg border border-forest-100">
                          <div className="text-[9px] text-forest-400 uppercase font-mono mb-1">Base</div>
                          {recommended1.base.map(item => item.note.nameKo || item.note.nameEn).join(', ')}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <button className="w-full py-2.5 rounded-xl text-xs font-bold transition-all bg-luxury-cream text-forest-700 border border-luxury-gold/20 hover:bg-luxury-cream/60">
                      이 테마로 선택
                    </button>
                  </div>
                </div>
              )}

              {/* 추천 2안 */}
              {recommended2 && (
                <div 
                  onClick={() => handleSelectRecipeType('name_sejong')}
                  className={`cursor-pointer bg-white border rounded-2xl p-6 md:p-8 flex flex-col justify-between space-y-6 transition-all duration-300 relative ${
                    selectedRecipeType === 'name_sejong'
                      ? 'border-luxury-gold ring-2 ring-luxury-gold/40 shadow-xl scale-[1.01]'
                      : 'border-luxury-gold/15 hover:border-forest-400 hover:shadow-md'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-luxury-sand/50 border border-luxury-gold/20 text-forest-800 font-bold uppercase tracking-wider">
                        추천 테마 02
                      </span>
                      <input 
                        type="radio" 
                        name="recipeSelect" 
                        checked={selectedRecipeType === 'name_sejong'} 
                        onChange={() => handleSelectRecipeType('name_sejong')}
                        className="w-4 h-4 text-forest-900 border-luxury-gold focus:ring-forest-800"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="font-serif text-2xl font-bold text-forest-950">이름과 세종이 만난 향</h3>
                      <p className="text-[11px] text-forest-400 italic">이름 분석, 취향 설문, 그리고 세종의 이야기 중 {selectedStory?.title}의 결합</p>
                    </div>
                    <p className="text-xs leading-relaxed text-forest-600 pl-3 border-l-2 border-luxury-gold font-medium">
                      "{recommended2.concept}"
                    </p>

                    <div className="space-y-3 pt-2">
                      <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-semibold text-forest-800">
                        <div className="bg-forest-50/50 p-2.5 rounded-lg border border-forest-100">
                          <div className="text-[9px] text-forest-400 uppercase font-mono mb-1">Top</div>
                          {recommended2.top.map(item => item.note.nameKo || item.note.nameEn).join(', ')}
                        </div>
                        <div className="bg-forest-50/50 p-2.5 rounded-lg border border-forest-100">
                          <div className="text-[9px] text-forest-400 uppercase font-mono mb-1">Middle</div>
                          {recommended2.middle.map(item => item.note.nameKo || item.note.nameEn).join(', ')}
                        </div>
                        <div className="bg-forest-50/50 p-2.5 rounded-lg border border-forest-100">
                          <div className="text-[9px] text-forest-400 uppercase font-mono mb-1">Base</div>
                          {recommended2.base.map(item => item.note.nameKo || item.note.nameEn).join(', ')}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <button className="w-full py-2.5 rounded-xl text-xs font-bold transition-all bg-luxury-cream text-forest-700 border border-luxury-gold/20 hover:bg-luxury-cream/60">
                      이 테마로 선택
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* 손님용 향료 편집기 개방 */}
            {selectedRecipeType && (
              <div className="bg-white border border-luxury-gold/20 rounded-2xl p-6 md:p-8 shadow-lg space-y-6 animate-slide-up">
                <div className="flex items-center gap-2 pb-3 border-b border-luxury-sand text-forest-950">
                  <Sliders className="w-5 h-5 text-luxury-gold" />
                  <h3 className="font-serif text-lg font-bold">나만의 향료 커스텀 조향</h3>
                  <span className="text-[10px] text-forest-500 font-sans ml-2">(향료를 추가/제거하거나 비율을 조정해 보세요)</span>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  
                  {/* 손님 Top Note */}
                  <div className="bg-luxury-cream/35 p-4 rounded-xl border border-luxury-gold/10 space-y-3">
                    <h4 className="font-serif text-xs font-bold text-forest-900 pb-1.5 border-b border-luxury-gold/20">Top Notes</h4>
                    <div className="space-y-2 min-h-[90px]">
                      {guestTop.map((item, idx) => (
                        <div key={item.note.id} className="bg-white p-2 rounded border border-forest-100 text-[10px] space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-forest-900">{item.note.nameKo}</span>
                            <button onClick={() => handleGuestRemoveNote('top', idx)} className="text-red-500 hover:text-red-700">×</button>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <input 
                              type="range" min="0" max="100" value={item.ratio || 0}
                              onChange={(e) => handleGuestRatioChange('top', idx, parseInt(e.target.value))}
                              className="flex-grow accent-forest-700 h-0.5 bg-forest-100 appearance-none cursor-pointer"
                            />
                            <span className="font-mono text-[9px] text-forest-700">{item.ratio}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-1 pt-1.5">
                      <select 
                        value={selectedGuestTopToAdd} onChange={(e) => setSelectedGuestTopToAdd(e.target.value)}
                        className="flex-grow p-1 bg-white border border-forest-200 rounded text-[9px] text-forest-800 focus:outline-none"
                      >
                        <option value="">탑 향료 추가...</option>
                        {NOTES.filter(n => n.type === 'top').map(n => (
                          <option key={n.id} value={n.id}>{n.nameKo}</option>
                        ))}
                      </select>
                      <button onClick={() => handleGuestAddNote('top', selectedGuestTopToAdd)} className="px-2 py-1 bg-forest-800 hover:bg-forest-950 text-luxury-cream rounded text-[9px] font-bold">추가</button>
                    </div>
                  </div>

                  {/* 손님 Middle Note */}
                  <div className="bg-luxury-cream/35 p-4 rounded-xl border border-luxury-gold/10 space-y-3">
                    <h4 className="font-serif text-xs font-bold text-forest-900 pb-1.5 border-b border-luxury-gold/20">Middle Notes</h4>
                    <div className="space-y-2 min-h-[90px]">
                      {guestMiddle.map((item, idx) => (
                        <div key={item.note.id} className="bg-white p-2 rounded border border-forest-100 text-[10px] space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-forest-900">{item.note.nameKo}</span>
                            <button onClick={() => handleGuestRemoveNote('middle', idx)} className="text-red-500 hover:text-red-700">×</button>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <input 
                              type="range" min="0" max="100" value={item.ratio || 0}
                              onChange={(e) => handleGuestRatioChange('middle', idx, parseInt(e.target.value))}
                              className="flex-grow accent-forest-700 h-0.5 bg-forest-100 appearance-none cursor-pointer"
                            />
                            <span className="font-mono text-[9px] text-forest-700">{item.ratio}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-1 pt-1.5">
                      <select 
                        value={selectedGuestMiddleToAdd} onChange={(e) => setSelectedGuestMiddleToAdd(e.target.value)}
                        className="flex-grow p-1 bg-white border border-forest-200 rounded text-[9px] text-forest-800 focus:outline-none"
                      >
                        <option value="">미들 향료 추가...</option>
                        {NOTES.filter(n => n.type === 'middle').map(n => (
                          <option key={n.id} value={n.id}>{n.nameKo}</option>
                        ))}
                      </select>
                      <button onClick={() => handleGuestAddNote('middle', selectedGuestMiddleToAdd)} className="px-2 py-1 bg-forest-800 hover:bg-forest-950 text-luxury-cream rounded text-[9px] font-bold">추가</button>
                    </div>
                  </div>

                  {/* 손님 Base Note */}
                  <div className="bg-luxury-cream/35 p-4 rounded-xl border border-luxury-gold/10 space-y-3">
                    <h4 className="font-serif text-xs font-bold text-forest-900 pb-1.5 border-b border-luxury-gold/20">Base Notes</h4>
                    <div className="space-y-2 min-h-[90px]">
                      {guestBase.map((item, idx) => (
                        <div key={item.note.id} className="bg-white p-2 rounded border border-forest-100 text-[10px] space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-forest-900">{item.note.nameKo}</span>
                            <button onClick={() => handleGuestRemoveNote('base', idx)} className="text-red-500 hover:text-red-700">×</button>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <input 
                              type="range" min="0" max="100" value={item.ratio || 0}
                              onChange={(e) => handleGuestRatioChange('base', idx, parseInt(e.target.value))}
                              className="flex-grow accent-forest-700 h-0.5 bg-forest-100 appearance-none cursor-pointer"
                            />
                            <span className="font-mono text-[9px] text-forest-700">{item.ratio}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-1 pt-1.5">
                      <select 
                        value={selectedGuestBaseToAdd} onChange={(e) => setSelectedGuestBaseToAdd(e.target.value)}
                        className="flex-grow p-1 bg-white border border-forest-200 rounded text-[9px] text-forest-800 focus:outline-none"
                      >
                        <option value="">베이스 향료 추가...</option>
                        {NOTES.filter(n => n.type === 'base').map(n => (
                          <option key={n.id} value={n.id}>{n.nameKo}</option>
                        ))}
                      </select>
                      <button onClick={() => handleGuestAddNote('base', selectedGuestBaseToAdd)} className="px-2 py-1 bg-forest-800 hover:bg-forest-950 text-luxury-cream rounded text-[9px] font-bold">추가</button>
                    </div>
                  </div>

                </div>

                {/* 손님용 배율 총합 트래커 */}
                <div className="flex justify-between items-center bg-luxury-cream/50 px-4 py-3 rounded-xl border border-luxury-gold/10 text-xs font-semibold text-forest-800">
                  <span>향료들의 비율 합계 (100%를 정확히 맞춰주셔야 제출이 가능합니다.)</span>
                  <span className={`font-mono text-sm font-bold ${guestTotalRatio === 100 ? 'text-green-600' : 'text-red-500 animate-pulse'}`}>
                    현재: {guestTotalRatio}%
                  </span>
                </div>

                {/* 최종 의뢰 제출 */}
                <div className="flex justify-center pt-3">
                  <button
                    onClick={handleGuestSubmitRecipe}
                    disabled={isAuthLoading || guestTotalRatio !== 100}
                    className="luxury-btn w-full max-w-md py-4 bg-forest-900 hover:bg-forest-955 text-luxury-cream font-bold text-base rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAuthLoading ? (
                      <div className="w-5 h-5 border-2 border-luxury-cream border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 text-luxury-gold" />
                        <span>나만의 향수 조향의뢰서 제출하기</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            )}

            <div className="flex justify-between items-center border-t border-luxury-sand pt-4">
              <button 
                onClick={() => setStep('survey')}
                className="flex items-center gap-1 text-sm font-bold text-forest-600 hover:text-forest-900"
              >
                <ChevronLeft className="w-4 h-4" /> 이전으로
              </button>
            </div>
          </div>
        )}

        {/* 제출 완료 대기 화면 */}
        {step === 'submit_done' && isLoggedIn && (
          <div className="max-w-md w-full bg-white border border-luxury-gold/15 rounded-2xl p-8 shadow-xl text-center space-y-6 animate-slide-up print-exclude">
            <div className="w-16 h-16 bg-forest-50 border border-forest-200 rounded-full flex items-center justify-center mx-auto text-forest-800">
              <CheckCircle className="w-8 h-8 text-luxury-gold" />
            </div>

            <div className="space-y-2">
              <h2 className="font-serif text-2xl font-bold text-forest-950">의뢰서 제출 완료</h2>
              <p className="text-sm text-forest-600 font-medium">
                조향 의뢰서가 성공적으로 전달되었습니다!
              </p>
              <p className="text-xs text-forest-400 leading-relaxed">
                공방의 조향사에게 제출 완료 소식을 말씀해 주시면, 최종 대시보드 검증을 거쳐 훈민향음 기록서(A6)를 인쇄해 드립니다.
              </p>
            </div>

            <div className="pt-2 border-t border-luxury-sand flex flex-col gap-2">
              <button
                onClick={handleStartNewJourney}
                className="w-full py-3 bg-forest-900 hover:bg-forest-955 text-white text-xs font-bold rounded-xl"
              >
                다른 이름으로 새 향수 만들기
              </button>
              <button
                onClick={handleGoToMyPage}
                className="w-full py-3 bg-luxury-cream border border-luxury-gold/20 text-forest-800 text-xs font-bold rounded-xl hover:bg-luxury-cream/60"
              >
                나의 전체 조향기록 보관소로 이동
              </button>
            </div>
          </div>
        )}

        {/* 일반 손님 마이페이지 (과거 기록 확인 및 신규 만들기 버튼) */}
        {step === 'mypage' && isLoggedIn && !isAdmin && (
          <div className="max-w-2xl w-full space-y-6 animate-slide-up print-exclude">
            <div className="bg-white border border-luxury-gold/15 rounded-2xl p-6 md:p-8 shadow-xl space-y-6">
              
              <div className="text-center space-y-1.5 border-b border-luxury-sand pb-4">
                <span className="text-[10px] tracking-widest text-luxury-goldDark font-serif uppercase">Guest Portal</span>
                <h2 className="font-serif text-2xl font-bold text-forest-950">조향 기록 보관소</h2>
                <p className="text-xs text-forest-500">본인 로그인 계정({loginId})으로 생성된 역대 조향 내역입니다.</p>
              </div>

              {/* 과거 조향 기록 목록 */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-forest-400 uppercase tracking-wider">나의 조향 기록 목록</h3>
                
                {isRecordsLoading ? (
                  <div className="text-center py-8 text-xs text-forest-400">상담 이력을 불러오는 중입니다...</div>
                ) : guestRecords.length === 0 ? (
                  <div className="text-center py-10 bg-luxury-cream/30 rounded-xl border border-dashed border-luxury-gold/20 text-xs text-forest-500">
                    아직 생성된 향수 기록이 없습니다. 새로운 조향을 시작해 보세요!
                  </div>
                ) : (
                  <div className="max-h-[260px] overflow-y-auto space-y-2 pr-1">
                    {guestRecords.map(rec => {
                      const recordStatus = rec.status || (rec.makerMemo ? 'completed' : 'submitted');
                      return (
                        <div key={rec.id} className="flex justify-between items-center p-3.5 bg-luxury-cream/40 border border-luxury-gold/10 rounded-xl hover:border-forest-400 transition-all">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-forest-950">{rec.guestName}</span>
                              <span className="text-[10px] text-forest-500 font-serif">({rec.perfumeName})</span>
                            </div>
                            <div className="flex gap-2 text-[9px] text-forest-400 font-mono">
                              <span>{rec.createdDate}</span>
                              <span>•</span>
                              <span>{rec.selectedType === 'name_only' ? '이름 분석' : '세종의 이야기'}</span>
                              <span>•</span>
                              <span className={recordStatus === 'completed' ? 'text-green-600 font-bold' : 'text-amber-600'}>
                                {recordStatus === 'completed' ? '조향 완성' : '접수 대기'}
                              </span>
                            </div>
                          </div>
                          
                          {recordStatus === 'completed' && (
                            <button
                              onClick={() => {
                                setFinalRecipe(rec);
                                setStep('record');
                              }}
                              className="px-3 py-1.5 bg-forest-900 text-luxury-cream text-[10px] font-bold rounded-lg hover:bg-forest-955 transition-colors flex items-center gap-1"
                            >
                              <Printer className="w-3 h-3 text-luxury-gold" /> 기록서 보기
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 거대한 새 향수 만들기 시작 버튼 */}
              <div className="pt-2 border-t border-luxury-sand flex gap-2">
                <button
                  onClick={() => setStep('input')}
                  className="flex-1 py-3 bg-luxury-cream border border-luxury-gold/20 text-forest-800 text-xs font-bold rounded-xl hover:bg-luxury-cream/60 text-center"
                >
                  뒤로 가기
                </button>
                <button
                  onClick={handleStartNewJourney}
                  className="flex-1 luxury-btn flex items-center justify-center gap-2 py-3 bg-forest-800 text-luxury-cream font-bold rounded-xl hover:bg-forest-900 shadow-md active:scale-[0.98]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-luxury-gold" />
                  <span>새 향수 만들기</span>
                </button>
              </div>

            </div>
          </div>
        )}

        {/* 조향사(관리자) 대시보드 화면 */}
        {step === 'mypage' && isLoggedIn && isAdmin && (
          <div className="max-w-7xl w-full grid lg:grid-cols-3 gap-8 items-start animate-slide-up print-exclude">
            
            {/* 좌측: 실시간 의뢰 목록 관리 (통합 목록 및 필터 칩 적용) */}
            <div className="lg:col-span-1 bg-white border border-luxury-gold/15 rounded-2xl p-6 shadow-xl space-y-6 h-[580px] flex flex-col justify-between">
              <div className="space-y-4">
                
                <div className="flex justify-between items-center border-b border-luxury-sand pb-3">
                  <div className="flex items-center gap-1.5 text-forest-950">
                    <Shield className="w-4 h-4 text-luxury-gold" />
                    <h3 className="font-serif text-base font-bold">의뢰 관리자 대시보드</h3>
                  </div>
                  <button 
                    onClick={loadAdminRecords}
                    className="p-1 hover:bg-luxury-cream rounded transition-colors text-forest-500 hover:text-forest-800"
                    title="새로고침"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 검색 필터 */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-forest-400" />
                  <input 
                    type="text" 
                    value={adminSearchTerm}
                    onChange={(e) => setAdminSearchTerm(e.target.value)}
                    placeholder="손님 이름 또는 향수명 검색"
                    className="w-full pl-9 pr-4 py-2 bg-luxury-cream border border-forest-200 rounded-lg text-xs focus:outline-none focus:border-forest-600"
                  />
                </div>

                {/* 통합 탭 대신에 세분화된 3가지 간편 필터 칩 제공 */}
                <div className="flex gap-1.5 bg-luxury-cream p-1.5 rounded-xl border border-luxury-gold/10">
                  <button
                    onClick={() => {
                      setAdminActiveTab('all');
                      setSelectedRecordForAdmin(null);
                      setSelectedAdminRecordIds([]);
                    }}
                    className={`flex-1 py-1.5 text-[9px] font-bold rounded-lg transition-all ${
                      adminActiveTab === 'all' 
                        ? 'bg-forest-900 text-white shadow-sm' 
                        : 'text-forest-500 hover:bg-white/40'
                    }`}
                  >
                    전체 ({adminRecords.length}건)
                  </button>
                  <button
                    onClick={() => {
                      setAdminActiveTab('submitted');
                      setSelectedRecordForAdmin(null);
                      setSelectedAdminRecordIds([]);
                    }}
                    className={`flex-1 py-1.5 text-[9px] font-bold rounded-lg transition-all ${
                      adminActiveTab === 'submitted' 
                        ? 'bg-amber-600 text-white shadow-sm' 
                        : 'text-forest-500 hover:bg-white/40'
                    }`}
                  >
                    대기 ({adminRecords.filter(r => (r.status || (r.makerMemo ? 'completed' : 'submitted')) === 'submitted').length}건)
                  </button>
                  <button
                    onClick={() => {
                      setAdminActiveTab('completed');
                      setSelectedRecordForAdmin(null);
                      setSelectedAdminRecordIds([]);
                    }}
                    className={`flex-1 py-1.5 text-[9px] font-bold rounded-lg transition-all ${
                      adminActiveTab === 'completed' 
                        ? 'bg-green-700 text-white shadow-sm' 
                        : 'text-forest-500 hover:bg-white/40'
                    }`}
                  >
                    완료 ({adminRecords.filter(r => (r.status || (r.makerMemo ? 'completed' : 'submitted')) === 'completed').length}건)
                  </button>
                </div>

                {/* 일괄 선택 제어 툴바 */}
                {filteredAdminRecords.length > 0 && (
                  <div className="flex items-center justify-between bg-luxury-cream/80 px-2.5 py-1.5 rounded-lg border border-luxury-sand/50 text-[10px] text-forest-700">
                    <button 
                      onClick={() => handleToggleAllSelect(filteredAdminRecords)}
                      className="flex items-center gap-1 hover:text-forest-950 font-bold"
                    >
                      {filteredAdminRecords.map(r => r.id).every(id => selectedAdminRecordIds.includes(id)) ? (
                        <CheckSquare className="w-3.5 h-3.5 text-forest-800" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-forest-400" />
                      )}
                      <span>전체 선택</span>
                    </button>
                    
                    {selectedAdminRecordIds.length > 0 && (
                      <button 
                        onClick={handleBatchDeleteRecords}
                        className="text-red-600 hover:text-red-700 font-bold flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>선택 삭제 ({selectedAdminRecordIds.length})</span>
                      </button>
                    )}
                  </div>
                )}

                {/* 의뢰 리스트 (체크박스 및 상태 배지 탑재) */}
                <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1">
                  {filteredAdminRecords.length === 0 ? (
                    <div className="text-center py-16 text-[10px] text-forest-400">조회된 의뢰서가 없습니다.</div>
                  ) : (
                    filteredAdminRecords.map(r => {
                      const isSelected = selectedRecordForAdmin?.id === r.id;
                      const isChecked = selectedAdminRecordIds.includes(r.id);
                      const recordStatus = r.status || (r.makerMemo ? 'completed' : 'submitted');
                      return (
                        <div 
                          key={r.id}
                          onClick={() => handleSelectAdminRecord(r)}
                          className={`p-3 border rounded-xl cursor-pointer transition-all flex items-center gap-2.5 ${
                            isSelected 
                              ? 'bg-forest-50 border-luxury-gold ring-1 ring-luxury-gold/20' 
                              : 'bg-white border-luxury-gold/10 hover:border-forest-400'
                          }`}
                        >
                          {/* 개별 선택 체크박스 */}
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleRecordSelect(r.id);
                            }}
                            className="p-1 hover:bg-forest-100/50 rounded transition-colors text-forest-600"
                          >
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-forest-800" />
                            ) : (
                              <Square className="w-4 h-4 text-forest-300" />
                            )}
                          </div>

                          <div className="flex-grow">
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-bold text-forest-900">{r.guestName}</span>
                                  {recordStatus === 'completed' ? (
                                    <span className="px-1.5 py-0.2 bg-green-50 border border-green-200 text-green-700 text-[8px] font-bold rounded">완료</span>
                                  ) : (
                                    <span className="px-1.5 py-0.2 bg-amber-50 border border-amber-200 text-amber-700 text-[8px] font-bold rounded">대기</span>
                                  )}
                                </div>
                                <h4 className="text-[11px] font-serif font-bold text-forest-950 mt-0.5 line-clamp-1">{r.perfumeName}</h4>
                              </div>
                            </div>
                            
                            <div className="flex justify-between items-center text-[8px] text-forest-400 font-mono mt-2 border-t border-luxury-sand/50 pt-1">
                              <span>{r.createdDate}</span>
                              <span className="font-semibold text-luxury-goldDark">
                                {r.selectedType === 'name_only' ? '이름 분석' : '세종 테마'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="text-[9px] text-forest-400 leading-normal border-t border-luxury-sand pt-3 font-medium">
                * 동일인 이름의 다중 의뢰 건들이 누락 없이 한 목록에 배지와 함께 모두 출력됩니다.
              </div>
            </div>

            {/* 우측 2칸: 조향사 수정 및 확정 패널 */}
            <div className="lg:col-span-2 space-y-6">
              {selectedRecordForAdmin ? (
                <div className="bg-forest-950 text-luxury-cream border border-forest-900 rounded-2xl p-6 md:p-8 shadow-xl space-y-6">
                  
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b border-forest-800 pb-4 gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] text-luxury-gold font-bold uppercase tracking-widest font-mono">Formulation (조향 상담 의뢰)</span>
                      <h3 className="font-serif text-xl font-bold text-white">이름: {selectedRecordForAdmin.guestName} 님</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-luxury-gold w-20 font-serif">향수 이름 :</label>
                      <input 
                        type="text" 
                        value={finalPerfumeName}
                        onChange={(e) => setFinalPerfumeName(e.target.value)}
                        placeholder="향수 이름을 기재하세요"
                        className="px-3 py-1.5 bg-forest-900 border border-forest-700 rounded-lg text-xs text-white focus:outline-none focus:border-luxury-gold min-w-[200px]"
                      />
                    </div>
                  </div>

                  {/* 노트별 향료 추가/비율 수정 */}
                  <div className="grid md:grid-cols-3 gap-4">
                    
                    {/* Top Note */}
                    <div className="bg-forest-900/40 p-4 rounded-xl border border-forest-800 space-y-3">
                      <h4 className="font-serif text-xs font-bold text-luxury-gold pb-1.5 border-b border-forest-800">Top Notes</h4>
                      <div className="space-y-2 min-h-[90px]">
                        {finalTop.map((item, idx) => (
                          <div key={item.note.id} className="bg-forest-950/60 p-2 rounded border border-forest-800 text-[10px] space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-white">{item.note.nameKo}</span>
                              <button onClick={() => handleRemoveNote('top', idx)} className="text-red-400 hover:text-red-300">×</button>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <input 
                                type="range" min="0" max="100" value={item.ratio || 0}
                                onChange={(e) => handleRatioChange('top', idx, parseInt(e.target.value))}
                                className="flex-grow accent-luxury-gold h-0.5 bg-forest-850 appearance-none cursor-pointer"
                              />
                              <span className="font-mono text-[9px] text-luxury-gold">{item.ratio}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-1 pt-1.5">
                        <select 
                          value={selectedTopToAdd} onChange={(e) => setSelectedTopToAdd(e.target.value)}
                          className="flex-grow p-1 bg-forest-950 border border-forest-850 rounded text-[9px] text-white focus:outline-none"
                        >
                          <option value="">탑 향료 추가...</option>
                          {NOTES.filter(n => n.type === 'top').map(n => (
                            <option key={n.id} value={n.id}>{n.nameKo}</option>
                          ))}
                        </select>
                        <button onClick={() => handleAddNote('top', selectedTopToAdd)} className="px-2 py-1 bg-luxury-gold text-forest-950 rounded text-[9px] font-bold">추가</button>
                      </div>
                    </div>

                    {/* Middle Note */}
                    <div className="bg-forest-900/40 p-4 rounded-xl border border-forest-800 space-y-3">
                      <h4 className="font-serif text-xs font-bold text-luxury-gold pb-1.5 border-b border-forest-800">Middle Notes</h4>
                      <div className="space-y-2 min-h-[90px]">
                        {finalMiddle.map((item, idx) => (
                          <div key={item.note.id} className="bg-forest-950/60 p-2 rounded border border-forest-800 text-[10px] space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-white">{item.note.nameKo}</span>
                              <button onClick={() => handleRemoveNote('middle', idx)} className="text-red-400 hover:text-red-300">×</button>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <input 
                                type="range" min="0" max="100" value={item.ratio || 0}
                                onChange={(e) => handleRatioChange('middle', idx, parseInt(e.target.value))}
                                className="flex-grow accent-luxury-gold h-0.5 bg-forest-850 appearance-none cursor-pointer"
                              />
                              <span className="font-mono text-[9px] text-luxury-gold">{item.ratio}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-1 pt-1.5">
                        <select 
                          value={selectedMiddleToAdd} onChange={(e) => setSelectedMiddleToAdd(e.target.value)}
                          className="flex-grow p-1 bg-forest-950 border border-forest-850 rounded text-[9px] text-white focus:outline-none"
                        >
                          <option value="">미들 향료 추가...</option>
                          {NOTES.filter(n => n.type === 'middle').map(n => (
                            <option key={n.id} value={n.id}>{n.nameKo}</option>
                          ))}
                        </select>
                        <button onClick={() => handleAddNote('middle', selectedMiddleToAdd)} className="px-2 py-1 bg-luxury-gold text-forest-950 rounded text-[9px] font-bold">추가</button>
                      </div>
                    </div>

                    {/* Base Note */}
                    <div className="bg-forest-900/40 p-4 rounded-xl border border-forest-800 space-y-3">
                      <h4 className="font-serif text-xs font-bold text-luxury-gold pb-1.5 border-b border-forest-800">Base Notes</h4>
                      <div className="space-y-2 min-h-[90px]">
                        {finalBase.map((item, idx) => (
                          <div key={item.note.id} className="bg-forest-950/60 p-2 rounded border border-forest-800 text-[10px] space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-white">{item.note.nameKo}</span>
                              <button onClick={() => handleRemoveNote('base', idx)} className="text-red-400 hover:text-red-300">×</button>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <input 
                                type="range" min="0" max="100" value={item.ratio || 0}
                                onChange={(e) => handleRatioChange('base', idx, parseInt(e.target.value))}
                                className="flex-grow accent-luxury-gold h-0.5 bg-forest-850 appearance-none cursor-pointer"
                              />
                              <span className="font-mono text-[9px] text-luxury-gold">{item.ratio}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-1 pt-1.5">
                        <select 
                          value={selectedBaseToAdd} onChange={(e) => setSelectedBaseToAdd(e.target.value)}
                          className="flex-grow p-1 bg-forest-950 border border-forest-850 rounded text-[9px] text-white focus:outline-none"
                        >
                          <option value="">베이스 향료 추가...</option>
                          {NOTES.filter(n => n.type === 'base').map(n => (
                            <option key={n.id} value={n.id}>{n.nameKo}</option>
                          ))}
                        </select>
                        <button onClick={() => handleAddNote('base', selectedBaseToAdd)} className="px-2 py-1 bg-luxury-gold text-forest-950 rounded text-[9px] font-bold">추가</button>
                      </div>
                    </div>

                  </div>

                  {/* 비율 총합 트래커 */}
                  <div className="flex justify-between items-center bg-forest-900/50 p-3 rounded-lg text-xs">
                    <span>비율 합계 (100% 필수)</span>
                    <span className={`font-bold font-mono ${currentTotalRatio === 100 ? 'text-green-400' : 'text-luxury-gold'}`}>
                      {currentTotalRatio}%
                    </span>
                  </div>

                  {/* 변경 내용 및 메모 입력 */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-[10px] text-forest-300 font-bold">변경 사항 기입 (추가/삭제/수정)</label>
                      <input 
                        type="text" placeholder="예) 추가: 피오니, 제거: 마린"
                        value={addedNotesText} onChange={(e) => setAddedNotesText(e.target.value)}
                        className="w-full px-3 py-2 bg-forest-900 border border-forest-800 rounded-lg text-xs text-white placeholder-forest-600 focus:outline-none focus:border-luxury-gold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] text-forest-300 font-bold">조향사 조언 메모</label>
                      <textarea 
                        placeholder="이름과 향의 스토리를 담아 한 문장으로 기재해주세요."
                        value={makerMemo} onChange={(e) => setMakerMemo(e.target.value)}
                        className="w-full p-2 bg-forest-900 border border-forest-800 rounded-lg text-xs text-white placeholder-forest-600 focus:outline-none focus:border-luxury-gold resize-none h-16"
                      />
                    </div>
                  </div>

                  {/* 완료 버튼 */}
                  <div className="flex justify-end pt-2">
                    <button 
                      onClick={handleConfirmAdminRecipe}
                      className="luxury-btn px-8 py-3 bg-luxury-gold hover:bg-luxury-goldLight text-forest-950 font-bold text-xs rounded-xl"
                    >
                      조향사 조향 확정 및 출력하기
                    </button>
                  </div>

                </div>
              ) : (
                <div className="border border-dashed border-luxury-gold/20 rounded-2xl py-36 text-center text-forest-500 font-medium">
                  {adminActiveTab === 'all' 
                    ? '상담 진행 또는 기록서 재출력할 손님을 목록에서 선택해 주세요.'
                    : adminActiveTab === 'submitted'
                    ? '상담을 진행할 손님의 대기 의뢰서를 목록에서 선택해 주세요.'
                    : '기록서를 다시 조회하거나 인쇄할 손님을 목록에서 선택해 주세요.'
                  }
                </div>
              )}
            </div>

          </div>
        )}

        {/* 5단계: 추억을 기록하다 (A6 인쇄 템플릿) */}
        {step === 'record' && finalRecipe && (
          <div className="max-w-xl w-full flex flex-col items-center space-y-6">
            
            {/* 상단 액션 바 */}
            <div className="w-full flex justify-between items-center bg-white border border-luxury-gold/20 p-4 rounded-2xl shadow-md print-exclude">
              <button 
                onClick={() => {
                  if (isAdmin) {
                    setStep('mypage');
                    loadAdminRecords();
                  } else {
                    setStep('mypage');
                    loadGuestRecords(loginId);
                  }
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-forest-700 hover:text-forest-955"
              >
                <ChevronLeft className="w-4 h-4" /> 목록 보관소로 돌아가기
              </button>
              <div className="flex gap-2">
                <button 
                  onClick={() => window.print()}
                  className="flex items-center gap-1 px-5 py-2.5 bg-forest-900 text-luxury-cream rounded-xl text-xs font-bold hover:bg-forest-955 shadow active:scale-[0.98]"
                >
                  <Printer className="w-3.5 h-3.5 text-luxury-gold" /> 기록서 출력 (Print)
                </button>
              </div>
            </div>

            {/* A6 사이즈 프리미엄 기록서 카드 */}
            <div className="record-card-container">
              <div id="hunmin-record-card" className="record-card print-area">
                
                {/* 상단 엠블럼 및 로고 */}
                <div className="text-center border-b border-luxury-gold/30 pb-2 space-y-0.5">
                  <div className="flex justify-center items-center gap-1.5">
                    <span className="text-[14px] font-bold font-serif tracking-[0.25em] text-forest-900">訓民香音</span>
                    <span className="w-4 h-4 bg-forest-900 text-luxury-cream text-[8px] font-bold flex items-center justify-center rounded">
                      印
                    </span>
                  </div>
                  <p className="text-[7px] tracking-[0.15em] text-luxury-goldDark font-serif font-semibold uppercase">
                    Hunminhyangeum Premium Scent Record
                  </p>
                </div>

                {/* 의뢰인 및 향수 정보 */}
                <div className="grid grid-cols-2 gap-4 text-[9px] pt-1">
                  <div className="space-y-1">
                    <span className="text-[7px] text-forest-400 font-bold block uppercase tracking-wider">Guest (손님 이름)</span>
                    <span className="font-serif font-bold text-forest-950 text-[11px]">{finalRecipe.guestName}</span>
                  </div>
                  <div className="space-y-1 text-right">
                    <span className="text-[7px] text-forest-400 font-bold block uppercase tracking-wider">Scent Name (향수 이름)</span>
                    <span className="font-serif font-bold text-forest-950 text-[11px]">{finalRecipe.perfumeName}</span>
                  </div>
                </div>

                {/* 생성일 및 무드 뱃지 */}
                <div className="flex justify-between items-center text-[8px] bg-luxury-cream/40 px-2 py-1.5 rounded border border-luxury-gold/10">
                  <div className="flex gap-1 items-center">
                    <span className="text-[7px] text-forest-400 font-bold uppercase">Mood:</span>
                    <span className="font-semibold text-forest-800">
                      {finalRecipe.analysis?.moodTags?.slice(0, 2).map(tag => `#${tag}`).join(' ') || '#맑은'} 
                      {finalRecipe.selectedStory ? ` #${finalRecipe.selectedStory.title.split(' ')[0]}` : ''}
                    </span>
                  </div>
                  <span className="text-forest-400 font-mono text-[7px] font-semibold">{finalRecipe.createdDate}</span>
                </div>

                {/* 향 스토리 문구 */}
                <div className="py-1">
                  <span className="text-[7px] text-forest-400 font-bold block uppercase tracking-wider mb-0.5">Scent Concept (향의 이야기)</span>
                  <p className="text-[8px] leading-relaxed text-forest-700 italic font-serif text-justify">
                    "{finalRecipe.originalRecipe?.concept}"
                  </p>
                </div>

                {/* 최종 노트 구성 리스트 */}
                <div className="space-y-1.5 border-t border-b border-luxury-gold/20 py-2">
                  
                  {/* Top Notes */}
                  <div className="grid grid-cols-4 gap-1 items-baseline">
                    <span className="text-[7px] font-bold text-forest-400 font-mono uppercase">Top Note</span>
                    <div className="col-span-3 flex flex-wrap gap-x-2 gap-y-0.5">
                      {finalRecipe.top.map(item => (
                        <span key={item.note.id} className="text-[8px] font-semibold text-forest-900">
                          {item.note.nameKo || item.note.nameEn} <span className="font-mono text-[7px] text-luxury-goldDark">({item.ratio}%)</span>
                        </span>
                      ))}
                      {finalRecipe.top.length === 0 && <span className="text-[8px] text-forest-300">-</span>}
                    </div>
                  </div>

                  {/* Middle Notes */}
                  <div className="grid grid-cols-4 gap-1 items-baseline">
                    <span className="text-[7px] font-bold text-forest-400 font-mono uppercase">Middle Note</span>
                    <div className="col-span-3 flex flex-wrap gap-x-2 gap-y-0.5">
                      {finalRecipe.middle.map(item => (
                        <span key={item.note.id} className="text-[8px] font-semibold text-forest-900">
                          {item.note.nameKo || item.note.nameEn} <span className="font-mono text-[7px] text-luxury-goldDark">({item.ratio}%)</span>
                        </span>
                      ))}
                      {finalRecipe.middle.length === 0 && <span className="text-[8px] text-forest-300">-</span>}
                    </div>
                  </div>

                  {/* Base Notes */}
                  <div className="grid grid-cols-4 gap-1 items-baseline">
                    <span className="text-[7px] font-bold text-forest-400 font-mono uppercase">Base Note</span>
                    <div className="col-span-3 flex flex-wrap gap-x-2 gap-y-0.5">
                      {finalRecipe.base.map(item => (
                        <span key={item.note.id} className="text-[8px] font-semibold text-forest-900">
                          {item.note.nameKo || item.note.nameEn} <span className="font-mono text-[7px] text-luxury-goldDark">({item.ratio}%)</span>
                        </span>
                      ))}
                      {finalRecipe.base.length === 0 && <span className="text-[8px] text-forest-300">-</span>}
                    </div>
                  </div>

                </div>

                {/* 조향사의 손길 */}
                <div className="space-y-1.5 py-1">
                  {/* 변경 내역 */}
                  {finalRecipe.addedNotes && finalRecipe.addedNotes.length > 0 && (
                    <div className="text-[7px] text-forest-500 flex flex-wrap gap-x-1 font-semibold bg-luxury-sand/30 p-1 rounded border border-luxury-gold/5">
                      <span>[조향 변경]: {finalRecipe.addedNotes.join(', ')}</span>
                    </div>
                  )}

                  <div className="space-y-0.5">
                    <span className="text-[7px] text-forest-400 font-bold block uppercase tracking-wider font-mono">Perfumer's Touch (조향사 의견)</span>
                    <p className="text-[8px] leading-normal text-forest-700 text-justify">
                      {finalRecipe.makerMemo || "이름과 세종의 은은한 향이 결합되어 완성되었습니다. 소중하게 조향한 단 하나의 향이 당신의 일상에 잔잔한 기쁨으로 기억되기를 바랍니다."}
                    </p>
                  </div>
                </div>

                {/* 훈민향음 낙인 서명 푸터 */}
                <div className="flex justify-between items-end border-t border-luxury-gold/20 pt-2 text-[6px] text-forest-400 font-mono">
                  <span className="tracking-[0.1em]">© 訓民香音 2026. ALL RIGHTS RESERVED.</span>
                  <div className="flex items-center gap-1 font-serif">
                    <span>조향사 :</span>
                    <span className="w-5 h-5 border border-forest-300 rounded-full flex items-center justify-center text-[7px] font-bold text-forest-600">
                      훈민
                    </span>
                  </div>
                </div>

              </div>
            </div>

            <p className="text-center text-xs text-forest-500 print-exclude">
              A6(105mm x 148mm) 규격의 포스트카드 형태로 인쇄하도록 맞춤 최적화되어 있습니다.<br />
              '출력하기' 버튼을 누르면 기록서 부분만 한 장에 깔끔하게 인쇄 가능합니다.
            </p>

          </div>
        )}

      </main>

      {/* Footer - 인쇄 시 미출력 */}
      <div className="print-exclude">
        <footer className="border-t border-luxury-gold/10 bg-forest-950 text-forest-300 py-6 text-center text-xs">
          <div className="max-w-6xl mx-auto px-4 space-y-2">
            <p className="font-serif tracking-widest text-[10px] text-luxury-gold/70">
              © 2026 훈민향음 (訓民香音). ALL RIGHTS RESERVED.
            </p>
            <p className="text-[9px] text-forest-500">
              이 웹앱은 조향 공방 내 조향사와 방문객 간의 원활한 커뮤니케이션과 레시피 설계를 돕는 디지털 조향 보조 플랫폼입니다.
            </p>
          </div>
        </footer>
      </div>

    </div>
  );
}
