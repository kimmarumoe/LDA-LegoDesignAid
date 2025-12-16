// frontend/src/types/guideTypes.js

/**
 * (기존 간단 브릭 타입 – 과거 코드에서 쓰고 있을 수 있어서 유지)
 * @typedef {Object} Brick
 * @property {number} x
 * @property {number} y
 * @property {number} z
 * @property {string} color
 * @property {string} type
 * @property {number} [groupId]
 */

/**
 * 레고 가이드 상단 요약 정보
 *
 * @typedef {Object} GuideSummary
 * @property {number} totalBricks
 * @property {number} uniqueTypes
 * @property {"초급"|"중급"|"고급"} difficulty
 * @property {string} estimatedTime
 */

/**
 * 단일 레고 브릭 정보
 *
 * - x, y, z : 모자이크 그리드 좌표
 * - color   : 레고 팔레트 색상 이름 (예: "bright-red")
 * - hex     : 실제 표시용 색상 코드 (예: "#FF0000")
 * - type    : 브릭 타입 (예: "plate", "tile")
 * - width   : 가로 스터드 수 (기본 1)
 * - height  : 세로 스터드 수 (기본 1)
 * - quantity: 동일 브릭 묶음 개수 (기본 1)
 *
 * @typedef {Object} GuideBrick
 * @property {number} x
 * @property {number} y
 * @property {number} z
 * @property {string} color
 * @property {string} hex
 * @property {string} type
 * @property {number} width
 * @property {number} height
 * @property {number} quantity
 */

/**
 * 조립 단계/영역 정보
 *
 * @typedef {Object} GuideStep
 * @property {number} id
 * @property {string} title
 * @property {string} [description]
 * @property {GuideBrick[]} bricks   이 단계에서 사용하는 브릭 목록
 */

/**
 * 팔레트 정보
 *
 * @typedef {Object} PaletteItem
 * @property {string} color
 * @property {string} [name]
 * @property {number} count
 * @property {string[]} types
 */

/**
 * 가이드 메타 정보
 *
 * @typedef {Object} GuideMeta
 * @property {number} width
 * @property {number} height
 * @property {string} createdAt
 * @property {"sample"|"ai"} [source]
 */

/**
 * 레고 조립 가이드 전체 응답 구조
 *
 * @typedef {Object} GuideResponse
 * @property {GuideSummary} summary
 * @property {GuideStep[]} groups       단계/영역별 정보
 * @property {GuideBrick[]} bricks      전체 브릭 리스트
 * @property {PaletteItem[]} palette    색상/타입 요약
 * @property {string[]} [tips]          조립 팁 목록 (선택)
 * @property {GuideMeta} [meta]
 */

/**
 * 가이드 생성 옵션
 *
 * @typedef {Object} GuideOptions
 * @property {number} [targetWidth]
 * @property {number} [targetHeight]
 * @property {number} [maxBricks]
 * @property {string[]} [colorPalette]
 */

/**
 * 가이드 생성 파라미터
 *
 * @typedef {Object} CreateGuideParams
 * @property {File} [file]
 * @property {GuideOptions} [options]
 */

export {};
