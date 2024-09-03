import {submodule} from '../src/hook.js';
import {ajax} from '../src/ajax.js';
import {isPlainObject, logInfo, mergeDeep} from '../src/utils.js';
import {getStorageManager} from '../src/storageManager.js';
import {MODULE_TYPE_RTD} from '../src/activities/modules.js';

const MODULE_NAME = 'realTimeData';
const SUBMODULE_NAME = 'asteriocatRtdProvider';
const DEFAULT_ENDPOINT = 'http://localhost:8080/support/getCategory';

export const storage = getStorageManager({moduleType: MODULE_TYPE_RTD, moduleName: SUBMODULE_NAME});

/**
 * Add real-time data & merge segments.
 * @param {Object} ortb2
 * @param {Object} rtd
 */
export function addRealTimeData(ortb2, rtd) {
  if (isPlainObject(rtd.ortb2)) {
    logInfo('Merge Asteriocat data to BidRequest');
    mergeDeep(ortb2, rtd.ortb2);
  }
}

function getCategoryData(endpoint, callback) {
  let pageUrl = window.location.href;
  let storageData;
  try {
    storageData = storage.getDataFromLocalStorage(pageUrl);
  } catch (e) {
  }
  if (storageData) {
    const json = JSON.parse(storageData);
    if (json?.length > 0) {
      logInfo('Asteriocat data received from storage:', storageData);
      callback(json);
      return;
    }
  }
  const url = `${endpoint || DEFAULT_ENDPOINT}?pageUrl=${encodeURIComponent(pageUrl)}`;
  ajax(url, {
    success: (response) => {
      let json = JSON.parse(response);
      if (json?.status === 'ok' && json.categories?.length > 0) {
        storage.setDataInLocalStorage(pageUrl, JSON.stringify(json.categories));
        callback(json.categories);
      }
    },
    error: () => {
      callback(null);
    }
  }, null);
}

export function getRealTimeData(reqBidsConfigObj, onDone, rtdConfig) {
  let endpoint;
  if (rtdConfig && isPlainObject(rtdConfig.params)) {
    endpoint = rtdConfig.params.endpoint;
  }
  let siteConfig = reqBidsConfigObj.ortb2Fragments?.global?.site;
  if (['cat', 'pagecat', 'sectioncat'].some(key => siteConfig?.[key]?.length > 0)) {
    logInfo('Asteriocat not called, BidRequest already contains categories');
    onDone();
    return;
  }
  getCategoryData(endpoint, (categoryData) => {
    if (categoryData) {
      const data = {
        ortb2: {
          site: {
            cat: categoryData
          }
        }
      }
      addRealTimeData(reqBidsConfigObj.ortb2Fragments?.global, data);
    }
    onDone();
  });
}

/**
 * Module init
 * @param {Object} provider
 * @param {Object} userConsent
 * @return {boolean}
 */
function init(provider, userConsent) {
  return true;
}

export const asteriocatSubmodule = {
  name: SUBMODULE_NAME,
  getBidRequestData: getRealTimeData,
  init: init
};

submodule(MODULE_NAME, asteriocatSubmodule);
