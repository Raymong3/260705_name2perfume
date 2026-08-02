import { useState, useEffect } from 'react';
import { Sparkles, ChevronLeft, ArrowRight, Printer, Trash2, Shield, Search, CheckCircle, RefreshCw, ClipboardList, CheckSquare, Square, Sliders, UserCheck, UserPlus, Heart } from 'lucide-react';
import { analyzeName } from '../logic/analyzeName';
import { recommendPerfumes } from '../logic/recommendPerfume';
import { NameAnalysis, PerfumeRecipe, SejongStory, FinalRecipe, RecommendedNote } from '../types/perfume';
import { SEJONG_STORIES } from '../data/sejongStories';
import { NOTES } from '../data/notes';
import { FAVORITE_SCENT_OPTIONS } from '../data/favoriteScents';
import { dbLoginGuest, dbCreateRecord, dbGetRecords, dbCompleteRecord, dbDeleteRecords } from '../logic/supabaseClient';

// 한국어 가나다 오름차순 사전 정렬 헬퍼 및 노트 목록
function sortNotesKo(notes: typeof NOTES) {
  return [...notes].sort((a, b) => {
    const nameA = a.nameKo || a.nameEn || '';
    const nameB = b.nameKo || b.nameEn || '';
    return nameA.localeCompare(nameB, 'ko-KR', { sensitivity: 'base', numeric: true });
  });
}

const SORTED_TOP_NOTES = sortNotesKo(NOTES.filter(n => n.type === 'top'));
const SORTED_MIDDLE_NOTES = sortNotesKo(NOTES.filter(n => n.type === 'middle'));
const SORTED_BASE_NOTES = sortNotesKo(NOTES.filter(n => n.type === 'base'));

// 향료 비율(Top, Middle, Base)의 합을 전체 동일한 비율로 정규화 조절해주는 헬퍼 함수
function normalizeRatios(
  top: RecommendedNote[],
  middle: RecommendedNote[],
  base: RecommendedNote[]
): { top: RecommendedNote[]; middle: RecommendedNote[]; base: RecommendedNote[] } {
  const allCount = top.length + middle.length + base.length;
  if (allCount === 0) return { top, middle, base };

  const equalRatio = Math.floor(100 / allCount);
  const rawPcts = new Array(allCount).fill(equalRatio);
  const sumPcts = rawPcts.reduce((a, b) => a + b, 0);
  const diff = 100 - sumPcts;
  if (diff !== 0 && rawPcts.length > 0) {
    rawPcts[0] += diff;
  }

  let idx = 0;
  const newTop = top.map(item => ({ ...item, ratio: rawPcts[idx++] }));
  const newMiddle = middle.map(item => ({ ...item, ratio: rawPcts[idx++] }));
  const newBase = base.map(item => ({ ...item, ratio: rawPcts[idx++] }));

  return { top: newTop, middle: newMiddle, base: newBase };
}

// 레시피 간 향료 추가/삭제 변경사항 자동 계산 헬퍼
function calcRecipeDiff(
  origTop: RecommendedNote[],
  origMiddle: RecommendedNote[],
  origBase: RecommendedNote[],
  currentTop: RecommendedNote[],
  currentMiddle: RecommendedNote[],
  currentBase: RecommendedNote[]
): string {
  const origNames = [...origTop, ...origMiddle, ...origBase].map(i => i.note.nameKo || i.note.nameEn);
  const currentNames = [...currentTop, ...currentMiddle, ...currentBase].map(i => i.note.nameKo || i.note.nameEn);

  const added = currentNames.filter(n => !origNames.includes(n));
  const removed = origNames.filter(n => !currentNames.includes(n));

  let autoMsg = '';
  if (added.length > 0) autoMsg += `추가: ${added.join(', ')}`;
  if (removed.length > 0) {
    if (autoMsg) autoMsg += ' / ';
    autoMsg += `제거: ${removed.join(', ')}`;
  }
  return autoMsg;
}

// 30ml 기준 용량 계산 헬퍼 함수 (전체 개수로 동일 분등)
function calcNoteMl(_ratio: number, totalCount: number): string {
  if (totalCount <= 0) return '0ml';
  const rawMl = 30 / totalCount;
  const rounded = Math.round(rawMl * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}ml` : `${rounded.toFixed(1)}ml`;
}

const DEFAULT_MAKER_MEMO_THEME1 = "이름의 자음모음과 형태소를 분석하여 오직 당신만을 위해 설계된 향입니다. 이름이 지닌 본연의 아름다움과 깊이가 당신의 일상에 은은하게 머물기를 바랍니다.";
const DEFAULT_MAKER_MEMO_THEME2 = "이름 분석 결과와 세종 명소의 정취 및 이야기를 한데 담아 조향하였습니다. 세종의 은은한 향기가 당신의 매일을 아름답게 밝혀주기를 바랍니다.";

function getDefaultMakerMemo(selectedType?: string): string {
  if (selectedType === 'name_sejong') {
    return DEFAULT_MAKER_MEMO_THEME2;
  }
  return DEFAULT_MAKER_MEMO_THEME1;
}

export default function App() {
  // 전체 플로우 상태: 'input' | 'mypage' | 'sejong' | 'analyzing' | 'result' | 'submit_done' | 'record'
  const [step, setStep] = useState<'input' | 'mypage' | 'sejong' | 'analyzing' | 'result' | 'submit_done' | 'record'>('input');
  
  // 분석 중 화면 프로그래스 상태
  const [analyzingProgress, setAnalyzingProgress] = useState(0);
  const [analyzingTextIdx, setAnalyzingTextIdx] = useState(0);
  
  // 인증 관련 상태
  const [authMode, setAuthMode] = useState<'new' | 'existing'>('new'); // 'new': 신규 접수, 'existing': 기존 접수자 조회
  const [loginId, setLoginId] = useState(''); // 휴대폰 번호 뒷자리 4자리
  const [selectedFavScentId, setSelectedFavScentId] = useState(''); // 12종 마음에 드는 향 선택 ID
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

  // 진행용 임시 상태
  const [analysis, setAnalysis] = useState<NameAnalysis | null>(null);
  const [selectedStory, setSelectedStory] = useState<SejongStory | null>(null);

  // 추천 결과 상태
  const [recommended1, setRecommended1] = useState<PerfumeRecipe | null>(null);
  const [recommended2, setRecommended2] = useState<PerfumeRecipe | null>(null);
  const [selectedRecipeType, setSelectedRecipeType] = useState<'name_only' | 'name_sejong' | null>(null);

  // 손님용 최종 커스터마이저 조향 상태
  const [guestTop, setGuestTop] = useState<RecommendedNote[]>([]);
  const [guestMiddle, setGuestMiddle] = useState<RecommendedNote[]>([]);
  const [guestBase, setGuestBase] = useState<RecommendedNote[]>([]);
  const [guestCustomPerfumeName, setGuestCustomPerfumeName] = useState('');
  const [selectedGuestTopToAdd, setSelectedGuestTopToAdd] = useState('');
  const [selectedGuestMiddleToAdd, setSelectedGuestMiddleToAdd] = useState('');
  const [selectedGuestBaseToAdd, setSelectedGuestBaseToAdd] = useState('');

  // 조향사 수정용 임시 상태
  const [finalTop, setFinalTop] = useState<RecommendedNote[]>([]);
  const [finalMiddle, setFinalMiddle] = useState<RecommendedNote[]>([]);
  const [finalBase, setFinalBase] = useState<RecommendedNote[]>([]);
  const [addedNotesText, setAddedNotesText] = useState('');
  const [makerMemo, setMakerMemo] = useState('');
  const [finalPerfumeName, setFinalPerfumeName] = useState('');
  const [selectedTopToAdd, setSelectedTopToAdd] = useState('');
  const [selectedMiddleToAdd, setSelectedMiddleToAdd] = useState('');
  const [selectedBaseToAdd, setSelectedBaseToAdd] = useState('');

  // 최종 확정 레시피
  const [finalRecipe, setFinalRecipe] = useState<FinalRecipe | null>(null);

  // 사용자 표출용 접수 정보 (숫자 + 향 명칭: 예 4440_자스민)
  const getDisplayGuestName = (idStr: string) => {
    if (!idStr) return '';
    const parts = idStr.split('_');
    const num = parts[0];
    const scentId = parts[1];
    if (!scentId) return num;
    const scentObj = FAVORITE_SCENT_OPTIONS.find(
      s => s.id.toLowerCase() === scentId.toLowerCase() || s.nameEn.toLowerCase() === scentId.toLowerCase()
    );
    return scentObj ? `${num}_${scentObj.nameKo}` : idStr;
  };

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

  // 접수 및 인증 핸들러
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const idTrimmed = loginId.trim();

    if (!idTrimmed) {
      setAuthError('접수번호(휴대폰 뒷자리 4자리)를 입력해주세요.');
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

    // 일반 손님 접수번호 유효성 검사 (휴대폰 뒷자리 4자리 숫자)
    if (!/^\d{4}$/.test(idTrimmed)) {
      setAuthError('휴대폰 번호 뒷자리 4자리 숫자만 입력해주세요. (예: 4440)');
      return;
    }

    // 마음에 드는 향 선택 유효성 검사
    if (!selectedFavScentId) {
      setAuthError('마음에 드는 향 12가지 중 1개를 선택해 주세요.');
      return;
    }

    // 고유 식별 사용자 키 생성 (4자리 숫자 + 선택한 향 ID)
    const fullUserKey = `${idTrimmed}_${selectedFavScentId}`;
    const selectedScentObj = FAVORITE_SCENT_OPTIONS.find(s => s.id === selectedFavScentId);
    const scentNameKo = selectedScentObj ? selectedScentObj.nameKo : '';

    setIsAuthLoading(true);
    try {
      // 전체 기록 조회하여 중복 유무 확인 (loginId 필드에 fullUserKey 저장)
      const allRecords = await dbGetRecords('admin9');
      const hasExistingRecord = allRecords.some(r => r.loginId === fullUserKey || (r as any).guestId === fullUserKey);

      if (authMode === 'new') {
        // [신규 접수] 모드
        if (hasExistingRecord) {
          alert(`[신규 접수 안내]\n\n입력하신 접수 정보 '접수번호 ${idTrimmed} + ${scentNameKo}'는 이미 사용 중입니다.\n\n다른 향을 선택하시거나 [기존 접수자 조회] 탭을 클릭해 주세요.`);
          setAuthError('이미 사용 중인 접수 정보입니다. 다른 향을 선택하거나 기존 접수 조회를 이용해 주세요.');
          setIsAuthLoading(false);
          return;
        }

        // 신규 사용자 로그인 및 등록 처리
        await dbLoginGuest(fullUserKey);
        setIsLoggedIn(true);
        setLoginId(fullUserKey);
        setStep('input');
        setGuestNameForRecipe('');
      } else {
        // [기존 접수자 조회] 모드
        if (!hasExistingRecord) {
          alert(`[기존 접수자 조회 안내]\n\n입력하신 '접수번호 ${idTrimmed} + ${scentNameKo}'에 대한 접수 기록을 찾을 수 없습니다.\n\n접수번호와 선택하신 향이 맞는지 확인하시거나 [신규 접수]를 진행해 주세요.`);
          setAuthError('일치하는 기존 접수 정보가 없습니다. 신규 접수를 이용해 주세요.');
          setIsAuthLoading(false);
          return;
        }

        // 기존 사용자 로그인 성공 및 보관소 이행
        await dbLoginGuest(fullUserKey);
        setIsLoggedIn(true);
        setLoginId(fullUserKey);
        setStep('mypage');
        await loadGuestRecords(fullUserKey);
      }
    } catch (err) {
      setAuthError('접수 처리 중 에러가 발생했습니다.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  // 로그아웃
  const handleLogout = () => {
    setLoginId('');
    setSelectedFavScentId('');
    setPasswordAdmin('');
    setIsLoggedIn(false);
    setIsAdmin(false);
    setGuestRecords([]);
    setAdminRecords([]);
    setSelectedAdminRecordIds([]);
    setSelectedRecordForAdmin(null);
    setAnalysis(null);
    setSelectedStory(null);
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

  const analyzingMessages = [
    `의뢰인 이름 '${analysis?.normalizedName || ''}'의 한글 자모음 감성 분석 중...`,
    `선택하신 세종시 '${selectedStory?.title || ''}'의 공간적 무드와 결합 중...`,
    `Top, Middle, Base 최적 향료 포뮬러 매칭 중...`,
    `훈민향음 시그니처 맞춤 추천 테마 2종 생성 완료!`
  ];

  // 분석 중(analyzing) 타이머 & 텍스트 전환 애니메이션 처리
  useEffect(() => {
    if (step !== 'analyzing') return;

    setAnalyzingProgress(0);
    setAnalyzingTextIdx(0);

    const progressInterval = setInterval(() => {
      setAnalyzingProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1; // ~4.0초 간 (40ms * 100 = 4000ms) 100%까지 증가
      });
    }, 40);

    const textInterval = setInterval(() => {
      setAnalyzingTextIdx(prev => (prev + 1) % 4);
    }, 1100);

    const finishTimeout = setTimeout(() => {
      setStep('result');
    }, 4500);

    return () => {
      clearInterval(progressInterval);
      clearInterval(textInterval);
      clearTimeout(finishTimeout);
    };
  }, [step]);

  // 2단계 완료 -> 분석 중(analyzing) 페이지 거쳐 추천 결과(result)로 이동
  const handleSejongSubmit = () => {
    if (!selectedStory) {
      alert('세종시의 명소 이야기를 하나 선택해주세요.');
      return;
    }
    if (analysis) {
      const { recipe1, recipe2 } = recommendPerfumes(analysis, selectedStory);
      setRecommended1(recipe1);
      setRecommended2(recipe2);
      setSelectedRecipeType(null);
      setStep('analyzing');
    }
  };

  // 손님이 3단계에서 추천 테마 선택 시 조향 복사 처리
  const handleSelectRecipeType = (type: 'name_only' | 'name_sejong') => {
    setSelectedRecipeType(type);
    const targetRecipe = type === 'name_only' ? recommended1 : recommended2;
    if (targetRecipe) {
      setGuestTop(JSON.parse(JSON.stringify(targetRecipe.top)));
      setGuestMiddle(JSON.parse(JSON.stringify(targetRecipe.middle)));
      setGuestBase(JSON.parse(JSON.stringify(targetRecipe.base)));
      setGuestCustomPerfumeName(targetRecipe.name || `${guestNameForRecipe}의 향`);
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



  // 추천 향 선택하여 조향 의뢰서 최종 제출 (100% 비율 자동 정규화 조정)
  const handleGuestSubmitRecipe = async () => {
    if (!selectedRecipeType) return;
    const targetRecipe = selectedRecipeType === 'name_only' ? recommended1 : recommended2;
    if (!targetRecipe || !analysis) return;

    // 수동 검증 없이 제출 시 비율을 자동으로 100%에 맞춰 정규화
    const normalized = normalizeRatios(guestTop, guestMiddle, guestBase);
    setGuestTop(normalized.top);
    setGuestMiddle(normalized.middle);
    setGuestBase(normalized.base);

    // 원본 테마 레시피 대비 변경된 향료 자동 계산
    const autoMsg = calcRecipeDiff(
      targetRecipe.top, targetRecipe.middle, targetRecipe.base,
      normalized.top, normalized.middle, normalized.base
    );

    setIsAuthLoading(true);
    try {
      const mockFinalRecipe: Partial<FinalRecipe> = {
        selectedType: selectedRecipeType,
        perfumeName: guestCustomPerfumeName.trim() || (guestNameForRecipe + '의 향'),
        top: normalized.top,
        middle: normalized.middle,
        base: normalized.base,
        originalRecipe: {
          top: targetRecipe.top,
          middle: targetRecipe.middle,
          base: targetRecipe.base
        },
        addedNotes: autoMsg ? [autoMsg] : [],
        removedNotes: [],
        modifiedNotes: [],
        makerMemo: '',
        analysis: analysis,
        selectedStory: selectedStory,
        surveyAnswers: []
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
    const topCopy: RecommendedNote[] = JSON.parse(JSON.stringify(record.top));
    const middleCopy: RecommendedNote[] = JSON.parse(JSON.stringify(record.middle));
    const baseCopy: RecommendedNote[] = JSON.parse(JSON.stringify(record.base));

    setFinalTop(topCopy);
    setFinalMiddle(middleCopy);
    setFinalBase(baseCopy);
    setFinalPerfumeName(record.perfumeName || record.guestName + '의 향');
    setMakerMemo(record.makerMemo || getDefaultMakerMemo(record.selectedType));

    // 추천 테마 원본 대비 변경 사항 자동 계산
    const origTop = record.originalRecipe?.top || [];
    const origMiddle = record.originalRecipe?.middle || [];
    const origBase = record.originalRecipe?.base || [];

    if (origTop.length > 0 || origMiddle.length > 0 || origBase.length > 0) {
      const diffMsg = calcRecipeDiff(origTop, origMiddle, origBase, topCopy, middleCopy, baseCopy);
      setAddedNotesText(diffMsg);
    } else if (record.addedNotes && record.addedNotes.length > 0) {
      setAddedNotesText(record.addedNotes.join(', '));
    } else {
      setAddedNotesText('');
    }
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
    const nextTop = category === 'top' ? [...finalTop, newItem] : finalTop;
    const nextMiddle = category === 'middle' ? [...finalMiddle, newItem] : finalMiddle;
    const nextBase = category === 'base' ? [...finalBase, newItem] : finalBase;

    if (category === 'top') {
      setFinalTop(nextTop);
      setSelectedTopToAdd('');
    } else if (category === 'middle') {
      setFinalMiddle(nextMiddle);
      setSelectedMiddleToAdd('');
    } else {
      setFinalBase(nextBase);
      setSelectedBaseToAdd('');
    }

    if (selectedRecordForAdmin) {
      const origTop = selectedRecordForAdmin.originalRecipe?.top || selectedRecordForAdmin.top || [];
      const origMiddle = selectedRecordForAdmin.originalRecipe?.middle || selectedRecordForAdmin.middle || [];
      const origBase = selectedRecordForAdmin.originalRecipe?.base || selectedRecordForAdmin.base || [];
      setAddedNotesText(calcRecipeDiff(origTop, origMiddle, origBase, nextTop, nextMiddle, nextBase));
    }
  };

  // 조향사 향료 삭제
  const handleRemoveNote = (category: 'top' | 'middle' | 'base', index: number) => {
    const nextTop = category === 'top' ? finalTop.filter((_, idx) => idx !== index) : finalTop;
    const nextMiddle = category === 'middle' ? finalMiddle.filter((_, idx) => idx !== index) : finalMiddle;
    const nextBase = category === 'base' ? finalBase.filter((_, idx) => idx !== index) : finalBase;

    if (category === 'top') setFinalTop(nextTop);
    else if (category === 'middle') setFinalMiddle(nextMiddle);
    else setFinalBase(nextBase);

    if (selectedRecordForAdmin) {
      const origTop = selectedRecordForAdmin.originalRecipe?.top || selectedRecordForAdmin.top || [];
      const origMiddle = selectedRecordForAdmin.originalRecipe?.middle || selectedRecordForAdmin.middle || [];
      const origBase = selectedRecordForAdmin.originalRecipe?.base || selectedRecordForAdmin.base || [];
      setAddedNotesText(calcRecipeDiff(origTop, origMiddle, origBase, nextTop, nextMiddle, nextBase));
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

  // 조향사 확정 ➔ A6 인쇄 화면 진입 (100% 비율 자동 정규화 조정)
  const handleConfirmAdminRecipe = async () => {
    if (!selectedRecordForAdmin) return;

    // 조향사 확정 시에도 비율 자동 정규화
    const normalized = normalizeRatios(finalTop, finalMiddle, finalBase);
    setFinalTop(normalized.top);
    setFinalMiddle(normalized.middle);
    setFinalBase(normalized.base);

    setIsAuthLoading(true);
    try {
      const updates: Partial<FinalRecipe> = {
        top: normalized.top,
        middle: normalized.middle,
        base: normalized.base,
        addedNotes: addedNotesText ? [addedNotesText] : [],
        removedNotes: [],
        modifiedNotes: [],
        perfumeName: finalPerfumeName.trim(),
        makerMemo: makerMemo.trim() || getDefaultMakerMemo(selectedRecordForAdmin.selectedType),
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

  // 신규 향수 만들기 시작 (이전 진행 데이터 리셋 후 세종시의 이야기로)
  const handleStartNewJourney = () => {
    setSelectedStory(null);
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
      <div className="print-exclude flex justify-between items-center bg-forest-950 px-6 py-4 text-white shadow-md border-b border-forest-800/80">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-luxury-gold animate-pulse" />
          <span className="font-serif font-bold tracking-[0.15em] text-sm md:text-base">훈민향음 (訓民香音)</span>
        </div>
        
        <div className="flex items-center gap-3">
          {/* 보관소 이동 버튼 - 로그인 여부와 관계없이 항시 노출 */}
          <button 
            onClick={() => {
              if (!isLoggedIn) {
                alert('접수번호(4자리)와 선호하는 향을 선택하여 접수한 후 보관소 이용이 가능합니다.');
                const inputEl = document.getElementById('loginIdInput');
                if (inputEl) inputEl.focus();
              } else if (isAdmin) {
                setStep('mypage');
                loadAdminRecords();
              } else {
                handleGoToMyPage();
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-forest-850 hover:bg-forest-750 border border-forest-700 rounded-lg text-xs font-bold text-luxury-cream transition-all duration-200 hover:scale-[1.02] shadow cursor-pointer"
            title="조향 기록 보관소 이동"
          >
            <ClipboardList className="w-3.5 h-3.5 text-luxury-gold" />
            <span>조향 보관소 이동</span>
          </button>

          {isLoggedIn && (
            <div className="flex items-center gap-3 border-l border-forest-800 pl-3">
              <span className="text-xs text-forest-300 font-medium">
                {isAdmin ? '조향사 (Admin)' : `접수번호: ${getDisplayGuestName(loginId)}`}
              </span>
              <button 
                onClick={handleLogout}
                className="px-3 py-1 bg-forest-900 text-forest-300 text-[10px] rounded border border-forest-750 hover:bg-forest-800 transition-colors"
              >
                접수 종료
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center py-10 px-4 bg-forest-950/60 print:py-0 print:px-0 print:bg-white">
        
        {/* 1단계 이전: 접수 및 접수번호 + 12종 향 선택 */}
        {!isLoggedIn && (
          <div className="max-w-5xl xl:max-w-6xl w-full grid lg:grid-cols-12 grid-cols-1 gap-8 items-center print-exclude">
            {/* Visual branding block */}
            <div className="lg:col-span-5 text-center md:text-left space-y-6 md:pr-4 animate-slide-up">
              <div className="inline-block px-3 py-1 rounded-full border border-forest-700 text-[11px] font-bold tracking-widest text-luxury-gold uppercase bg-forest-900/80">
                조향 상담 - 접수
              </div>
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white">
                훈민향음<br />
                <span className="text-luxury-gold font-medium text-2xl md:text-3xl font-serif">(訓民香音)</span>
              </h1>
              <p className="text-sm md:text-base leading-relaxed text-forest-200 font-medium">
                훈민정음의 조화로움처럼,<br className="hidden md:inline" />
                당신의 이름과 세종시의 감성을 하나의 특별한 향으로 완성합니다.
              </p>
            </div>

            {/* Reception form block (Dark Green theme) */}
            <div className="lg:col-span-7 bg-forest-900/90 border border-forest-750 rounded-2xl p-6 md:p-8 shadow-2xl flex flex-col justify-center space-y-5 relative overflow-hidden backdrop-blur-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-forest-800/40 to-transparent opacity-60 -z-10 rounded-tr-2xl"></div>
              
              <div className="text-center md:text-left space-y-1.5">
                <span className="text-[10px] tracking-widest text-luxury-gold font-serif uppercase font-bold block">Scent Registration</span>
                <h2 className="font-serif text-2xl font-bold text-white">세종의 향을 담다</h2>
                <p className="text-xs text-forest-300">
                  휴대폰 번호 뒷자리 4자리와 마음에 드는 향 1가지를 선택해 접수해 주세요.
                </p>
              </div>

              {/* 신규 접수 vs 기존 접수자 조회 모드 선택 탭 */}
              <div className="grid grid-cols-2 gap-2 bg-forest-950 p-1.5 rounded-xl border border-forest-800">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('new');
                    setAuthError('');
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    authMode === 'new' 
                      ? 'bg-forest-800 text-luxury-cream shadow border border-forest-650' 
                      : 'text-forest-400 hover:text-forest-200'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5 text-luxury-gold" />
                  <span>신규 접수</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('existing');
                    setAuthError('');
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    authMode === 'existing' 
                      ? 'bg-forest-800 text-luxury-cream shadow border border-forest-650' 
                      : 'text-forest-400 hover:text-forest-200'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5 text-luxury-gold" />
                  <span>기존 접수자 조회</span>
                </button>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {/* 접수번호 4자리 필드 */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-forest-200">접수번호 (휴대폰 뒷자리 4자리)</label>
                    <span className="text-[10px] text-forest-400 font-mono">예: 4440</span>
                  </div>
                  <input 
                    id="loginIdInput"
                    type="text" 
                    maxLength={10}
                    value={loginId}
                    onChange={(e) => {
                      setLoginId(e.target.value);
                      if (authError) setAuthError('');
                    }}
                    placeholder="예: 4440"
                    disabled={isAuthLoading}
                    className="w-full px-4 py-3 bg-forest-950/90 border border-forest-800 rounded-xl text-sm text-white placeholder-forest-500 focus:outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 text-center text-lg font-bold tracking-widest transition-all"
                  />
                </div>

                {/* 관리자(admin9) 2차 비밀번호 필드 */}
                {isMasterLogin && (
                  <div className="space-y-1 animate-slide-up">
                    <label className="block text-xs font-bold text-emerald-400 mb-1">관리자 비밀번호 (Password)</label>
                    <input 
                      type="password"
                      value={passwordAdmin}
                      onChange={(e) => {
                        setPasswordAdmin(e.target.value);
                        if (authError) setAuthError('');
                      }}
                      placeholder="관리자 비밀번호 4자리 입력"
                      className="w-full px-4 py-3 bg-forest-950 border border-emerald-700/60 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 text-center text-lg font-bold tracking-widest"
                    />
                  </div>
                )}

                {/* 12종 마음에 드는 향 선택 그리드 (3x4 또는 4x3) */}
                {!isMasterLogin && (
                  <div className="space-y-2 pt-1">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-bold text-forest-200 flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 text-luxury-gold" />
                        <span>마음에 드는 향 1가지 선택 (12종 중 택 1)</span>
                      </label>
                      <span className="text-[10px] text-luxury-gold font-semibold">
                        {selectedFavScentId 
                          ? `${FAVORITE_SCENT_OPTIONS.find(s => s.id === selectedFavScentId)?.nameKo} 선택됨` 
                          : '필수 선택'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {FAVORITE_SCENT_OPTIONS.map((option) => {
                        const isSelected = selectedFavScentId === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => {
                              setSelectedFavScentId(option.id);
                              if (authError) setAuthError('');
                            }}
                            className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                              isSelected 
                                ? 'bg-forest-800 border-luxury-gold ring-2 ring-luxury-gold/40 shadow-lg text-white' 
                                : 'bg-forest-950/80 border-forest-800 text-forest-300 hover:border-forest-700 hover:bg-forest-900/60'
                            }`}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[9px] font-bold text-luxury-gold font-mono uppercase">{option.tag}</span>
                              {isSelected && <span className="text-[10px] text-luxury-gold font-bold">✓</span>}
                            </div>
                            <div className="font-serif text-xs font-bold text-white leading-tight">{option.nameKo}</div>
                            <div className="text-[9px] text-forest-400 font-mono tracking-tight mt-0.5 truncate">{option.nameEn}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {authError && (
                  <p className="text-xs text-red-400 font-semibold text-center bg-red-950/40 p-2 rounded border border-red-900/60">{authError}</p>
                )}

                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-forest-800 hover:bg-forest-700 border border-forest-650 text-luxury-cream font-medium rounded-xl transition-all shadow-lg active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  {isAuthLoading ? (
                    <div className="w-5 h-5 border-2 border-luxury-cream border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-luxury-gold" />
                      <span>{authMode === 'new' ? '신규 접수하고 조향 여정 시작' : '기존 접수 정보 조회하기'}</span>
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
              <div className="inline-block px-3.5 py-1.5 rounded-full border border-forest-700 text-xs font-bold tracking-widest text-luxury-gold uppercase bg-forest-900/80">
                1단계: 나를 읽다
              </div>
              <h1 className="font-serif text-4xl md:text-6xl font-bold leading-tight text-white">
                훈민향음<br />
                <span className="text-luxury-gold font-medium text-2xl md:text-3xl font-serif">(訓民香音)</span>
              </h1>
              <p className="text-sm md:text-base leading-relaxed text-forest-200 font-medium">
                의뢰하실 분의 이름을 입력해 주세요. <br />
                가족, 친구 등 다른 사람들의 이름으로도 언제든 새로 향수를 조향할 수 있습니다.
              </p>
            </div>

            <div className="bg-forest-900/90 border border-forest-750 rounded-2xl p-8 shadow-2xl flex flex-col justify-center space-y-6 relative overflow-hidden backdrop-blur-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-forest-800/40 to-transparent opacity-60 -z-10 rounded-tr-2xl"></div>
              <div className="space-y-2 text-center md:text-left">
                <h3 className="font-serif text-xl font-bold text-white">의뢰 대상자 성함</h3>
                <p className="text-xs text-forest-300">향수를 소유할 분의 이름을 공백 없이 입력해주세요.</p>
              </div>

              <form onSubmit={handleNameNext} className="space-y-6">
                <div className="relative">
                  <label htmlFor="guestName" className="block text-xs font-bold text-forest-200 mb-2">이름 (Name)</label>
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
                    className="w-full px-5 py-4 bg-forest-950 border border-forest-800 focus:border-forest-500 rounded-xl text-white placeholder-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/20 transition-all duration-300 text-lg tracking-wide"
                  />
                  {nameError && (
                    <div className="flex items-center gap-1.5 mt-2.5 text-xs text-red-400 font-semibold bg-red-950/40 p-2 rounded border border-red-900/60 animate-fade-in">
                      <span>{nameError}</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-forest-800 text-luxury-cream font-medium rounded-xl hover:bg-forest-700 border border-forest-650 transition-all duration-300 shadow-lg active:scale-[0.98] disabled:opacity-50 cursor-pointer"
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

        {/* 2단계: 세종을 담다 */}
        {step === 'sejong' && isLoggedIn && (
          <div className="max-w-6xl w-full space-y-8 animate-slide-up print-exclude">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold tracking-widest text-luxury-gold uppercase bg-forest-900/80 px-3.5 py-1.5 rounded-full border border-forest-700 inline-block">2단계: 세종을 담다</span>
              <h2 className="font-serif text-3xl font-bold text-white">세종시의 이야기를 담다</h2>
              <p className="text-sm text-forest-200 max-w-lg mx-auto">
                이름 '{analysis?.normalizedName}'의 향에 녹여내고 싶은 세종시의 명소 이야기를 하나 선택해 주세요.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {SEJONG_STORIES.map((story) => {
                const isSelected = selectedStory?.id === story.id;
                return (
                  <button
                    key={story.id}
                    onClick={() => setSelectedStory(story)}
                    className={`text-left p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between min-h-[250px] bg-forest-950/80 relative overflow-hidden group hover:shadow-2xl cursor-pointer ${
                      isSelected 
                        ? 'border-luxury-gold ring-2 ring-luxury-gold/40 shadow-xl bg-forest-850/90' 
                        : 'border-forest-800 hover:border-forest-650 hover:bg-forest-900/90'
                    }`}
                  >
                    <div className="absolute -bottom-8 -right-8 w-28 h-28 bg-forest-800/20 rounded-full group-hover:scale-110 transition-transform duration-500 -z-10"></div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="font-serif text-xs font-bold text-luxury-gold tracking-wider uppercase">
                          {story.title}
                        </span>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-luxury-gold text-forest-950 flex items-center justify-center text-[10px] font-bold shadow">
                            ✓
                          </span>
                        )}
                      </div>
                      <h3 className="font-serif text-lg font-bold text-white group-hover:text-luxury-cream transition-colors">
                        {story.subtitle}
                      </h3>
                      <p className="text-xs text-forest-300 leading-relaxed font-medium line-clamp-4">
                        {story.description}
                      </p>
                    </div>

                    <div className="text-[10px] font-semibold text-forest-400 italic pt-2.5 border-t border-forest-800 w-full mt-3">
                      {story.imageDesc}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-4">
              <button 
                onClick={() => setStep('input')}
                className="flex items-center gap-1 text-sm font-bold text-forest-300 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> 이전으로
              </button>
              <button
                onClick={handleSejongSubmit}
                disabled={!selectedStory}
                className="flex items-center gap-1.5 px-6 py-3 bg-forest-800 text-luxury-cream rounded-xl text-sm font-semibold hover:bg-forest-700 border border-forest-650 shadow-lg disabled:opacity-50 transition-all cursor-pointer"
              >
                <span>향 추천 제안 보기</span> <ArrowRight className="w-4 h-4 text-luxury-gold" />
              </button>
            </div>
          </div>
        )}

        {/* 분석 중 애니메이션 페이지 (스텝 2 세종시 이야기 선택 후 스텝 3 결과 이동 전) */}
        {step === 'analyzing' && isLoggedIn && (
          <div className="max-w-xl w-full bg-forest-900/90 backdrop-blur-lg border border-forest-750 rounded-3xl p-8 md:p-12 shadow-2xl text-center space-y-8 animate-fade-in print-exclude my-auto">
            
            {/* 회전하는 로고 엠블럼 & 아우라 */}
            <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-luxury-gold/20 border-t-luxury-gold animate-spin"></div>
              <div className="absolute inset-2 rounded-full border-2 border-forest-700 border-b-forest-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '3s' }}></div>
              <div className="w-20 h-20 bg-forest-950 rounded-full flex items-center justify-center text-luxury-gold shadow-xl animate-pulse">
                <Sparkles className="w-10 h-10 animate-bounce text-luxury-gold" />
              </div>
            </div>

            {/* 헤더 및 실시간 메시지 */}
            <div className="space-y-3">
              <span className="inline-block px-3.5 py-1 rounded-full bg-forest-950 border border-forest-800 text-[11px] font-bold text-luxury-gold uppercase tracking-widest">
                Hunmin Scent Analyzing...
              </span>
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-white">
                나만의 맞춤 향 레시피 분석 중
              </h2>
              <p className="text-sm font-medium text-forest-200 min-h-[44px] flex items-center justify-center px-4 transition-all duration-300">
                {analyzingMessages[analyzingTextIdx]}
              </p>
            </div>

            {/* 프로그래스 바 & 카운터 */}
            <div className="space-y-2 max-w-md mx-auto">
              <div className="flex justify-between items-center text-xs font-mono font-bold text-forest-700 px-1">
                <span>포뮬러 매칭 진행률</span>
                <span className="text-luxury-goldDark text-sm">{analyzingProgress}%</span>
              </div>
              <div className="w-full h-3 bg-luxury-cream rounded-full overflow-hidden p-0.5 border border-luxury-gold/30 shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-forest-800 via-luxury-gold to-forest-950 rounded-full transition-all duration-75 shadow-md"
                  style={{ width: `${analyzingProgress}%` }}
                ></div>
              </div>
            </div>

            {/* 하단 푸터 문구 */}
            <div className="pt-4 border-t border-luxury-sand text-[11px] text-forest-500 font-serif italic">
              훈민정음의 기품 있는 감성과 세종시 명소의 공간적 향기가 어우러지고 있습니다.
            </div>

          </div>
        )}

        {/* 3단계: 향을 잇다 (추천 결과 & 커스텀 조향) */}
        {step === 'result' && isLoggedIn && (
          <div className="max-w-6xl w-full space-y-8 animate-slide-up print-exclude">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold tracking-widest text-luxury-gold uppercase bg-forest-900/80 px-3.5 py-1.5 rounded-full border border-forest-700 inline-block">3단계: 향을 잇다</span>
              <h2 className="font-serif text-3xl font-bold text-white">당신의 향을 다듬다</h2>
              <p className="text-xs text-forest-200">
                두 가지 추천 테마 중 마음에 드는 안을 선택하고, 하단의 조향 편집기에서 원하는 향료를 자유롭게 조정할 수 있습니다.
              </p>
            </div>

            {/* 테마 추천 2안 그리드 */}
            <div className="grid md:grid-cols-2 gap-8 items-stretch">
              
              {/* 추천 1안 */}
              {recommended1 && (
                <div 
                  onClick={() => handleSelectRecipeType('name_only')}
                  className={`cursor-pointer bg-forest-950/90 border rounded-2xl p-6 md:p-8 flex flex-col justify-between space-y-6 transition-all duration-300 relative ${
                    selectedRecipeType === 'name_only'
                      ? 'border-luxury-gold ring-2 ring-luxury-gold/40 shadow-2xl scale-[1.01] bg-forest-900/90'
                      : 'border-forest-800 hover:border-forest-650 hover:bg-forest-900/60'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-forest-900 border border-forest-750 text-luxury-gold font-bold uppercase tracking-wider">
                        추천 테마 01
                      </span>
                      <input 
                        type="radio" 
                        name="recipeSelect" 
                        checked={selectedRecipeType === 'name_only'} 
                        onChange={() => handleSelectRecipeType('name_only')}
                        className="w-4 h-4 text-luxury-gold border-forest-700 focus:ring-forest-800 accent-luxury-gold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="font-serif text-2xl font-bold text-white">나의 이름을 담은 향</h3>
                      <p className="text-[11px] text-forest-400 italic">이름의 한글 조합 및 분위기 분석 기반</p>
                    </div>
                    <p className="text-xs leading-relaxed text-forest-200 pl-3 border-l-2 border-luxury-gold font-medium">
                      "{recommended1.concept}"
                    </p>

                    <div className="space-y-3 pt-2">
                      {/* 향료 조향 스토리 및 선정 이유 전체 요약 */}
                      <div className="bg-forest-900/60 p-3.5 rounded-xl border border-forest-800 space-y-1.5 text-left">
                        <div className="text-[10px] text-luxury-gold font-bold flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-luxury-gold" /> 조향 스토리 & 선정 이유
                        </div>
                        <p className="text-xs text-forest-200 leading-relaxed font-sans">
                          {recommended1.description}
                        </p>
                      </div>

                      {/* 포함 향료 노트 구성 */}
                      <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-semibold text-white pt-1">
                        <div className="bg-forest-900/80 p-2.5 rounded-lg border border-forest-800">
                          <div className="text-[9px] text-luxury-gold uppercase font-mono mb-1 font-bold">Top</div>
                          {recommended1.top.map(item => item.note.nameKo || item.note.nameEn).join(', ')}
                        </div>
                        <div className="bg-forest-900/80 p-2.5 rounded-lg border border-forest-800">
                          <div className="text-[9px] text-luxury-gold uppercase font-mono mb-1 font-bold">Middle</div>
                          {recommended1.middle.map(item => item.note.nameKo || item.note.nameEn).join(', ')}
                        </div>
                        <div className="bg-forest-900/80 p-2.5 rounded-lg border border-forest-800">
                          <div className="text-[9px] text-luxury-gold uppercase font-mono mb-1 font-bold">Base</div>
                          {recommended1.base.map(item => item.note.nameKo || item.note.nameEn).join(', ')}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center pt-2">
                    <button className="w-full py-2.5 rounded-xl text-xs font-bold transition-all bg-forest-800 text-luxury-cream border border-forest-650 hover:bg-forest-700">
                      이 테마로 선택
                    </button>
                  </div>
                </div>
              )}

              {/* 추천 2안 */}
              {recommended2 && (
                <div 
                  onClick={() => handleSelectRecipeType('name_sejong')}
                  className={`cursor-pointer bg-forest-950/90 border rounded-2xl p-6 md:p-8 flex flex-col justify-between space-y-6 transition-all duration-300 relative ${
                    selectedRecipeType === 'name_sejong'
                      ? 'border-luxury-gold ring-2 ring-luxury-gold/40 shadow-2xl scale-[1.01] bg-forest-900/90'
                      : 'border-forest-800 hover:border-forest-650 hover:bg-forest-900/60'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-forest-900 border border-forest-750 text-luxury-gold font-bold uppercase tracking-wider">
                        추천 테마 02
                      </span>
                      <input 
                        type="radio" 
                        name="recipeSelect" 
                        checked={selectedRecipeType === 'name_sejong'} 
                        onChange={() => handleSelectRecipeType('name_sejong')}
                        className="w-4 h-4 text-luxury-gold border-forest-700 focus:ring-forest-800 accent-luxury-gold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="font-serif text-2xl font-bold text-white">이름과 세종시가 만난 향</h3>
                      <p className="text-[11px] text-forest-400 italic">이름 분석과 세종시 명소 중 {selectedStory?.title}의 결합</p>
                    </div>
                    <p className="text-xs leading-relaxed text-forest-200 pl-3 border-l-2 border-luxury-gold font-medium">
                      "{recommended2.concept}"
                    </p>

                    <div className="space-y-3 pt-2">
                      {/* 향료 조향 스토리 및 선정 이유 전체 요약 */}
                      <div className="bg-forest-900/60 p-3.5 rounded-xl border border-forest-800 space-y-1.5 text-left">
                        <div className="text-[10px] text-luxury-gold font-bold flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-luxury-gold" /> 조향 스토리 & 선정 이유
                        </div>
                        <p className="text-xs text-forest-200 leading-relaxed font-sans">
                          {recommended2.description}
                        </p>
                      </div>

                      {/* 포함 향료 노트 구성 */}
                      <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-semibold text-white pt-1">
                        <div className="bg-forest-900/80 p-2.5 rounded-lg border border-forest-800">
                          <div className="text-[9px] text-luxury-gold uppercase font-mono mb-1 font-bold">Top</div>
                          {recommended2.top.map(item => item.note.nameKo || item.note.nameEn).join(', ')}
                        </div>
                        <div className="bg-forest-900/80 p-2.5 rounded-lg border border-forest-800">
                          <div className="text-[9px] text-luxury-gold uppercase font-mono mb-1 font-bold">Middle</div>
                          {recommended2.middle.map(item => item.note.nameKo || item.note.nameEn).join(', ')}
                        </div>
                        <div className="bg-forest-900/80 p-2.5 rounded-lg border border-forest-800">
                          <div className="text-[9px] text-luxury-gold uppercase font-mono mb-1 font-bold">Base</div>
                          {recommended2.base.map(item => item.note.nameKo || item.note.nameEn).join(', ')}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <button className="w-full py-2.5 rounded-xl text-xs font-bold transition-all bg-forest-800 text-luxury-cream border border-forest-650 hover:bg-forest-700">
                      이 테마로 선택
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* 손님용 향료 편집기 개방 */}
            {selectedRecipeType && (
              <div className="bg-forest-900/90 border border-forest-750 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 backdrop-blur-lg animate-slide-up">
                <div className="flex items-center gap-2 pb-3 border-b border-forest-800 text-white">
                  <Sliders className="w-5 h-5 text-luxury-gold" />
                  <h3 className="font-serif text-lg font-bold">나만의 향료 커스텀 조향</h3>
                  <span className="text-[10px] text-forest-300 font-sans ml-2">(향료를 추가/제거하거나 원하는 비율로 조정해 보세요)</span>
                </div>

                {/* 향수 이름 사용자 직접 입력 */}
                <div className="bg-forest-950/60 p-4 rounded-xl border border-forest-800 space-y-2">
                  <label className="block text-xs font-bold text-luxury-gold font-serif">
                    향수 이름 (Perfume Name)
                  </label>
                  <input
                    type="text"
                    value={guestCustomPerfumeName}
                    onChange={(e) => setGuestCustomPerfumeName(e.target.value)}
                    placeholder="나만의 향수 이름을 입력해 주세요 (예: 이응다리의 바람)"
                    className="w-full px-4 py-2.5 bg-forest-950 border border-forest-800 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold/30"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  
                  {/* 손님 Top Note */}
                  <div className="bg-forest-950/40 p-4 rounded-xl border border-forest-800 space-y-3">
                    <h4 className="font-serif text-xs font-bold text-luxury-gold pb-1.5 border-b border-forest-800">Top Notes</h4>
                    <div className="space-y-2 min-h-[90px]">
                      {guestTop.map((item, idx) => (
                        <div key={item.note.id} className="bg-forest-950/80 p-2.5 rounded-lg border border-forest-800 text-xs flex justify-between items-center">
                          <span className="font-bold text-white">{item.note.nameKo || item.note.nameEn}</span>
                          <button onClick={() => handleGuestRemoveNote('top', idx)} className="text-red-400 hover:text-red-300 font-bold px-1 text-sm">×</button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-1 pt-1.5">
                      <select 
                        value={selectedGuestTopToAdd} onChange={(e) => setSelectedGuestTopToAdd(e.target.value)}
                        className="flex-grow p-1 bg-forest-950 border border-forest-850 rounded text-[9px] text-white focus:outline-none"
                      >
                        <option value="">탑 향료 추가...</option>
                        {SORTED_TOP_NOTES.map(n => (
                          <option key={n.id} value={n.id}>{n.nameKo}</option>
                        ))}
                      </select>
                      <button onClick={() => handleGuestAddNote('top', selectedGuestTopToAdd)} className="px-2 py-1 bg-luxury-gold text-forest-950 rounded text-[9px] font-bold">추가</button>
                    </div>
                  </div>

                  {/* 손님 Middle Note */}
                  <div className="bg-forest-950/40 p-4 rounded-xl border border-forest-800 space-y-3">
                    <h4 className="font-serif text-xs font-bold text-luxury-gold pb-1.5 border-b border-forest-800">Middle Notes</h4>
                    <div className="space-y-2 min-h-[90px]">
                      {guestMiddle.map((item, idx) => (
                        <div key={item.note.id} className="bg-forest-950/80 p-2.5 rounded-lg border border-forest-800 text-xs flex justify-between items-center">
                          <span className="font-bold text-white">{item.note.nameKo || item.note.nameEn}</span>
                          <button onClick={() => handleGuestRemoveNote('middle', idx)} className="text-red-400 hover:text-red-300 font-bold px-1 text-sm">×</button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-1 pt-1.5">
                      <select 
                        value={selectedGuestMiddleToAdd} onChange={(e) => setSelectedGuestMiddleToAdd(e.target.value)}
                        className="flex-grow p-1 bg-forest-950 border border-forest-850 rounded text-[9px] text-white focus:outline-none"
                      >
                        <option value="">미들 향료 추가...</option>
                        {SORTED_MIDDLE_NOTES.map(n => (
                          <option key={n.id} value={n.id}>{n.nameKo}</option>
                        ))}
                      </select>
                      <button onClick={() => handleGuestAddNote('middle', selectedGuestMiddleToAdd)} className="px-2 py-1 bg-luxury-gold text-forest-950 rounded text-[9px] font-bold">추가</button>
                    </div>
                  </div>

                  {/* 손님 Base Note */}
                  <div className="bg-forest-950/40 p-4 rounded-xl border border-forest-800 space-y-3">
                    <h4 className="font-serif text-xs font-bold text-luxury-gold pb-1.5 border-b border-forest-800">Base Notes</h4>
                    <div className="space-y-2 min-h-[90px]">
                      {guestBase.map((item, idx) => (
                        <div key={item.note.id} className="bg-forest-950/80 p-2.5 rounded-lg border border-forest-800 text-xs flex justify-between items-center">
                          <span className="font-bold text-white">{item.note.nameKo || item.note.nameEn}</span>
                          <button onClick={() => handleGuestRemoveNote('base', idx)} className="text-red-400 hover:text-red-300 font-bold px-1 text-sm">×</button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-1 pt-1.5">
                      <select 
                        value={selectedGuestBaseToAdd} onChange={(e) => setSelectedGuestBaseToAdd(e.target.value)}
                        className="flex-grow p-1 bg-forest-950 border border-forest-850 rounded text-[9px] text-white focus:outline-none"
                      >
                        <option value="">베이스 향료 추가...</option>
                        {SORTED_BASE_NOTES.map(n => (
                          <option key={n.id} value={n.id}>{n.nameKo}</option>
                        ))}
                      </select>
                      <button onClick={() => handleGuestAddNote('base', selectedGuestBaseToAdd)} className="px-2 py-1 bg-luxury-gold text-forest-950 rounded text-[9px] font-bold">추가</button>
                    </div>
                  </div>

                </div>

                {/* 30ml 기준 용량 안내 트래커 */}
                <div className="flex flex-col md:flex-row justify-between items-center bg-forest-950/80 p-3.5 rounded-xl border border-forest-800 text-xs text-forest-200 gap-2">
                  <div className="space-y-0.5 text-left">
                    <span className="font-bold text-white block">용량 안내 (총 30ml 용기 기준)</span>
                    <span className="text-[11px] text-forest-300">
                      * 30ml 기준: 향료 5개 선택 시 각 6ml, 6개 선택 시 각 5ml씩 투입하여 조향합니다.
                    </span>
                  </div>
                  <div className="font-mono text-xs font-bold text-luxury-gold bg-forest-900 px-3 py-1.5 rounded-lg border border-forest-800">
                    선택된 향료: 총 {guestTop.length + guestMiddle.length + guestBase.length}개 (30ml 용기 기준)
                  </div>
                </div>

                {/* 최종 의뢰 제출 */}
                <div className="flex justify-center pt-3">
                  <button
                    onClick={handleGuestSubmitRecipe}
                    disabled={isAuthLoading}
                    className="luxury-btn w-full max-w-md py-4 bg-forest-900 hover:bg-forest-955 text-luxury-cream font-bold text-base rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
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
                onClick={() => setStep('sejong')}
                className="flex items-center gap-1 text-sm font-bold text-forest-600 hover:text-forest-900"
              >
                <ChevronLeft className="w-4 h-4" /> 이전으로
              </button>
            </div>
          </div>
        )}

        {/* 제출 완료 대기 화면 */}
        {step === 'submit_done' && isLoggedIn && (
          <div className="max-w-md w-full bg-forest-900/90 border border-forest-750 rounded-2xl p-8 shadow-2xl text-center space-y-6 animate-slide-up print-exclude backdrop-blur-lg">
            <div className="w-16 h-16 bg-forest-950 border border-forest-800 rounded-full flex items-center justify-center mx-auto text-forest-800">
              <CheckCircle className="w-8 h-8 text-luxury-gold" />
            </div>

            <div className="space-y-2">
              <h2 className="font-serif text-2xl font-bold text-white">의뢰서 제출 완료</h2>
              <p className="text-sm text-forest-200 font-medium">
                조향 의뢰서가 성공적으로 전달되었습니다!
              </p>
              <p className="text-xs text-forest-300 leading-relaxed">
                공방의 조향사에게 제출 완료 소식을 말씀해 주시면, 최종 대시보드 검증을 거쳐 훈민향음 기록서(A6)를 인쇄해 드립니다.
              </p>
            </div>

            <div className="pt-2 border-t border-forest-800 flex flex-col gap-2">
              <button
                onClick={handleStartNewJourney}
                className="w-full py-3 bg-forest-800 hover:bg-forest-700 text-luxury-cream text-xs font-bold rounded-xl border border-forest-650 transition-all cursor-pointer"
              >
                다른 이름으로 새 향수 만들기
              </button>
              <button
                onClick={handleGoToMyPage}
                className="w-full py-3 bg-forest-950 border border-forest-800 text-forest-200 text-xs font-bold rounded-xl hover:bg-forest-900 transition-all cursor-pointer"
              >
                나의 전체 조향기록 보관소로 이동
              </button>
            </div>
          </div>
        )}

        {/* 일반 손님 마이페이지 (과거 기록 확인 및 신규 만들기 버튼) */}
        {step === 'mypage' && isLoggedIn && !isAdmin && (
          <div className="max-w-2xl w-full space-y-6 animate-slide-up print-exclude">
            <div className="bg-forest-900/90 border border-forest-750 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 backdrop-blur-lg">
              
              <div className="text-center space-y-1.5 border-b border-forest-800 pb-4">
                <span className="text-[10px] tracking-widest text-luxury-gold font-serif uppercase font-bold">Guest Portal</span>
                <h2 className="font-serif text-2xl font-bold text-white">조향 기록 보관소</h2>
                <p className="text-xs text-forest-300 font-medium">
                  본인 로그인 계정 <span className="font-bold text-luxury-gold">{getDisplayGuestName(loginId)}</span>으로 생성된 역대 조향 내역입니다.
                </p>
              </div>

              {/* 과거 조향 기록 목록 */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-luxury-gold uppercase tracking-wider">나의 조향 기록 목록</h3>
                
                {isRecordsLoading ? (
                  <div className="text-center py-8 text-xs text-forest-400">상담 이력을 불러오는 중입니다...</div>
                ) : guestRecords.length === 0 ? (
                  <div className="text-center py-10 bg-forest-950/60 rounded-xl border border-dashed border-forest-800 text-xs text-forest-400">
                    아직 생성된 향수 기록이 없습니다. 새로운 조향을 시작해 보세요!
                  </div>
                ) : (
                  <div className="max-h-[260px] overflow-y-auto space-y-2 pr-1">
                    {guestRecords.map(rec => {
                      const recordStatus = rec.status || (rec.makerMemo ? 'completed' : 'submitted');
                      return (
                        <div key={rec.id} className="flex justify-between items-center p-3.5 bg-forest-950/80 border border-forest-800 rounded-xl hover:border-forest-650 transition-all">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">{rec.guestName}</span>
                              <span className="text-[10px] text-luxury-gold font-serif">({rec.perfumeName})</span>
                            </div>
                            <div className="flex gap-2 text-[9px] text-forest-400 font-mono">
                              <span>{rec.createdDate}</span>
                              <span>•</span>
                              <span>{rec.selectedType === 'name_only' ? '이름 분석' : '세종의 이야기'}</span>
                              <span>•</span>
                              <span className={recordStatus === 'completed' ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
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
                              className="px-3 py-1.5 bg-forest-800 text-luxury-cream text-[10px] font-bold rounded-lg hover:bg-forest-700 transition-colors flex items-center gap-1 border border-forest-650"
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
                                  <span className="text-[9px] text-forest-500 font-mono">({getDisplayGuestName(r.loginId)})</span>
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
                      <h3 className="font-serif text-xl font-bold text-white">
                        이름: {selectedRecordForAdmin.guestName} 님{' '}
                        <span className="text-xs font-mono text-luxury-gold">({getDisplayGuestName(selectedRecordForAdmin.loginId)})</span>
                      </h3>
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
                              <span className="font-mono text-[9px] text-luxury-gold font-bold">
                                {calcNoteMl(item.ratio || 0, finalTop.length + finalMiddle.length + finalBase.length)}
                              </span>
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
                          {SORTED_TOP_NOTES.map(n => (
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
                              <span className="font-mono text-[9px] text-luxury-gold font-bold">
                                {calcNoteMl(item.ratio || 0, finalTop.length + finalMiddle.length + finalBase.length)}
                              </span>
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
                          {SORTED_MIDDLE_NOTES.map(n => (
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
                              <span className="font-mono text-[9px] text-luxury-gold font-bold">
                                {calcNoteMl(item.ratio || 0, finalTop.length + finalMiddle.length + finalBase.length)}
                              </span>
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
                          {SORTED_BASE_NOTES.map(n => (
                            <option key={n.id} value={n.id}>{n.nameKo}</option>
                          ))}
                        </select>
                        <button onClick={() => handleAddNote('base', selectedBaseToAdd)} className="px-2 py-1 bg-luxury-gold text-forest-950 rounded text-[9px] font-bold">추가</button>
                      </div>
                    </div>

                  </div>

                  {/* 용량 및 비율 총합 트래커 */}
                  <div className="flex flex-col md:flex-row justify-between items-center bg-forest-900/50 p-3 rounded-lg text-xs gap-2">
                    <div className="space-y-0.5 text-left">
                      <span className="font-bold text-white block">용량 합계 (총 30ml 용기 기준)</span>
                      <span className="text-[10px] text-forest-300 font-sans">
                        * 30ml 투입 기준: 향료 5개 시 각 6ml, 6개 시 각 5ml씩 투입
                      </span>
                    </div>
                    <span className="font-bold font-mono text-sm text-luxury-gold">
                      {Math.round(((currentTotalRatio || 0) / 100) * 30)}ml / 30ml
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
                          {item.note.nameKo || item.note.nameEn}{' '}
                          <span className="font-mono text-[7px] text-luxury-goldDark">
                            ({calcNoteMl(item.ratio || 0, finalRecipe.top.length + finalRecipe.middle.length + finalRecipe.base.length)})
                          </span>
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
                          {item.note.nameKo || item.note.nameEn}{' '}
                          <span className="font-mono text-[7px] text-luxury-goldDark">
                            ({calcNoteMl(item.ratio || 0, finalRecipe.top.length + finalRecipe.middle.length + finalRecipe.base.length)})
                          </span>
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
                          {item.note.nameKo || item.note.nameEn}{' '}
                          <span className="font-mono text-[7px] text-luxury-goldDark">
                            ({calcNoteMl(item.ratio || 0, finalRecipe.top.length + finalRecipe.middle.length + finalRecipe.base.length)})
                          </span>
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
                    <div className="text-[7px] text-forest-700 flex flex-wrap gap-x-1 font-semibold bg-luxury-sand/40 p-1.5 rounded border border-luxury-gold/20">
                      <span>[조향 변경]: {finalRecipe.addedNotes.join(', ')}</span>
                    </div>
                  )}

                  <div className="space-y-0.5">
                    <span className="text-[7px] text-forest-400 font-bold block uppercase tracking-wider font-mono">Perfumer's Touch (조향사 의견)</span>
                    <p className="text-[8px] leading-normal text-forest-700 text-justify">
                      {finalRecipe.makerMemo || getDefaultMakerMemo(finalRecipe.selectedType)}
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
