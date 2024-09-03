import {config} from 'src/config.js';
import {addRealTimeData, asteriocatSubmodule, getRealTimeData, storage} from 'modules/asteriocatRtdProvider.js';
import sinon from 'sinon';

describe('asteriocatRtdProvider', function () {
  let getDataFromLocalStorageStub;
  beforeEach(function () {
    config.resetConfig();
    getDataFromLocalStorageStub = sinon.stub(storage, 'getDataFromLocalStorage');
  });

  afterEach(function () {
    getDataFromLocalStorageStub.restore();
  });

  describe('asteriocatSubmodule', function () {
    it('successfully instantiates', function () {
      expect(asteriocatSubmodule.init()).to.equal(true);
    });
  });

  describe('Asteriocat Real-Time Data', function () {
    it('merge ortb2Fragment data', function () {
      const bidConfig = {
        ortb2Fragments: {
          global: {
            site: {}
          }
        }
      };

      const rtdCats = ['IAB10-2', 'IAB10-3'];
      const rtd = {
        ortb2: {
          site: {
            cat: rtdCats
          }
        }
      };

      addRealTimeData(bidConfig.ortb2Fragments.global, rtd);

      expect(bidConfig.ortb2Fragments.global.site.cat).to.deep.equal(rtdCats);
    });
  });

  describe('Get Asteriocat Real-Time Data', function () {
    it('gets data from local storage cache', function () {
      const bidConfig = {
        ortb2Fragments: {
          global: {
            site: {}
          }
        }
      };
      const rtdConfig = {
        params: {}
      };

      const cachedRtd = ['IAB12-2', 'IAB12-3'];
      getDataFromLocalStorageStub.withArgs(window.location.href).returns(JSON.stringify(cachedRtd));

      getRealTimeData(bidConfig, () => {
      }, rtdConfig);
      expect(bidConfig.ortb2Fragments.global.site?.cat).to.deep.equal(cachedRtd);
    });
  });

  describe('Get Asteriocat Real-Time Data', function () {
    it('avoid to get categories if they exist in config', function () {
      const configCats = ['IAB10-1', 'IAB10-2'];
      const bidConfig = {
        ortb2Fragments: {
          global: {
            site: {
              cat: configCats
            }
          }
        }
      };

      const rtdConfig = {
        params: {}
      };

      const cachedRtd = ['IAB12-2', 'IAB12-3'];
      getDataFromLocalStorageStub.withArgs(window.location.href).returns(JSON.stringify(cachedRtd));

      getRealTimeData(bidConfig, () => {
      }, rtdConfig);
      expect(bidConfig.ortb2Fragments.global.site?.cat).to.deep.equal(configCats);
    });
  });
});
