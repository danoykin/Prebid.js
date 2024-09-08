import {submodule} from '../src/hook.js';
import {ajax} from '../src/ajax.js';
import {deepSetValue, prefixLog} from '../src/utils.js';
import {getStorageManager} from '../src/storageManager.js';
import {MODULE_TYPE_RTD} from '../src/activities/modules.js';
import {getRefererInfo} from '../src/refererDetection.js'

const MODULE_NAME = 'realTimeData';
const SUBMODULE_NAME = 'asteriocatRtdProvider';
const DEFAULT_ENDPOINT = 'https://endpt.asteriocat.com';

const {logInfo} = prefixLog('|AsterioCatRtdProvider|')

export const storage = getStorageManager({moduleType: MODULE_TYPE_RTD, moduleName: SUBMODULE_NAME});

let pageCategories
let pageCategoriesPromise
let pageCategoriesTime

export function getRealTimeData(reqBidsConfigObj, onDone, rtdConfig) {
  let siteConfig = reqBidsConfigObj.ortb2Fragments?.global?.site;
  if (['cat', 'sectioncat', 'pagecat'].some(key => siteConfig?.[key]?.length > 0)) {
    logInfo('request has already contained categories');
    onDone();
    return;
  }

  if (pageCategories === undefined) {
    const start = Date.now()
    pageCategoriesPromise.then(() => {
      logInfo('Waited: ' + (Date.now() - start) + ' ms')
      injectCategories(reqBidsConfigObj, onDone)
    }) // wait completion of call to server
  } else {
    injectCategories(reqBidsConfigObj, onDone)
  }
}

function injectCategories(reqBidsConfigObj, onDone) {
  const siteConfig = reqBidsConfigObj.ortb2Fragments?.global.site;

  deepSetValue(siteConfig, 'ext.asteriocat.enabled', true);
  deepSetValue(siteConfig, 'ext.asteriocat.time', pageCategoriesTime);

  if (pageCategories && pageCategories.length > 0) {
    deepSetValue(siteConfig, 'pagecat', pageCategories)
  }

  onDone()
}

/**
 * Module init
 * @param {Object} provider
 * @param {Object} userConsent
 * @return {boolean}
 */
export function init(provider, userConsent) {
  return true
}

function readPageCategories() {
  return new Promise((resolve, reject) => {
    let endpoint = window.asteriocatEndpoint || DEFAULT_ENDPOINT;

    const refererInfo = getRefererInfo()
    let pageUrl = refererInfo.page

    const url = `${endpoint}/api/categorize?url=${encodeURIComponent(pageUrl)}`;
    ajax(url, {
      success: (response) => {
        let categories = ''
        let json = JSON.parse(response);
        if (json?.status === 'ok' && json.categories?.length > 0) {
          categories = json.categories.join(',')
          logInfo('Categories: ', json.categories)
        } else {
          logInfo('No categories, status: ', json?.status)
        }
        resolve(categories)
      },
      error: () => {
        resolve('')
      }
    }, null);
  });
}

export const asteriocatSubmodule = {
  name: SUBMODULE_NAME,
  getBidRequestData: getRealTimeData,
  init: init
};

function beforeInit() {
  const start = Date.now()
  pageCategoriesPromise = readPageCategories().then(categories => {
    pageCategories = categories
    pageCategoriesTime = Date.now() - start
  })
  submodule(MODULE_NAME, asteriocatSubmodule)
}

beforeInit()
