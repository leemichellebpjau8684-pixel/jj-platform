import { Order, Landmark } from './types';

export const SHANGHAI_DISTRICTS = [
  '线上', '黄浦区', '徐汇区', '长宁区', '静安区', '普陀区', '虹口区',
  '杨浦区', '闵行区', '宝山区', '嘉定区', '浦东新区', '金山区',
  '松江区', '青浦区', '奉贤区', '崇明区'
];

export const GRADES = [
  '小学', '初中', '高中', '幼儿启蒙', '成人', '其他'
];

export const SUBJECTS = [
  '英语', '数学', '语文', '物理', '化学', '全科', '文科', '理科', '历史',
  '地理', '生物', '政治', '科学', '奥数', '道法', '艺术', '体育', '外语',
  '陪读', '作业辅导', '学前教育', '未识别'
];

// High-fidelity Shanghai High School and University landmarks
export const SHANGHAI_UNIVERSITIES: Landmark[] = [
  {
    id: 'fudan_hd',
    name: '复旦大学 (邯郸校区)',
    address: '杨浦区五角场邯郸路220号',
    coordinate: { lat: 31.2989, lng: 121.5035 },
    type: 'university'
  },
  {
    id: 'fudan_fl',
    name: '复旦大学 (枫林校区)',
    address: '徐汇区医学院路138号',
    coordinate: { lat: 31.1963, lng: 121.4552 },
    type: 'university'
  },
  {
    id: 'sjtu_mh',
    name: '上海交通大学 (闵行校区)',
    address: '闵行区东川路800号',
    coordinate: { lat: 31.0253, lng: 121.4341 },
    type: 'university'
  },
  {
    id: 'sjtu_xh',
    name: '上海交通大学 (徐汇校区)',
    address: '徐汇区华山路1954号',
    coordinate: { lat: 31.2004, lng: 121.4350 },
    type: 'university'
  },
  {
    id: 'tongji_sp',
    name: '同济大学 (四平路校区)',
    address: '杨浦区四平路1239号',
    coordinate: { lat: 31.2828, lng: 121.5088 },
    type: 'university'
  },
  {
    id: 'tongsi_jb',
    name: '同济大学 (嘉定校区)',
    address: '嘉定区曹安公路4800号',
    coordinate: { lat: 31.2845, lng: 121.2188 },
    type: 'university'
  },
  {
    id: 'ecnu_zs',
    name: '华东师范大学 (中山北路校区)',
    address: '普陀区中山北路3663号',
    coordinate: { lat: 31.2284, lng: 121.4075 },
    type: 'university'
  },
  {
    id: 'ecnu_mh',
    name: '华东师范大学 (闵行校区)',
    address: '闵行区东川路500号',
    coordinate: { lat: 31.0325, lng: 121.4590 },
    type: 'university'
  },
  {
    id: 'shisu_hk',
    name: '上海外国语大学 (虹口校区)',
    address: '虹口区大连西路550号',
    coordinate: { lat: 31.2705, lng: 121.4805 },
    type: 'university'
  },
  {
    id: 'shisu_sp',
    name: '上海外国语大学 (松江校区)',
    address: '松江区文翔路1550号',
    coordinate: { lat: 31.0515, lng: 121.2105 },
    type: 'university'
  },
  {
    id: 'shu_jd',
    name: '上海大学 (嘉定校区)',
    address: '嘉定区城中路20号',
    coordinate: { lat: 31.3815, lng: 121.2505 },
    type: 'university'
  },
  {
    id: 'shu_bs',
    name: '上海大学 (宝山校区)',
    address: '宝山区上大路99号',
    coordinate: { lat: 31.3155, lng: 121.4065 },
    type: 'university'
  },
  {
    id: 'dhu_yan',
    name: '东华大学 (延安路校区)',
    address: '长宁区延安西路1882号',
    coordinate: { lat: 31.2008, lng: 121.4125 },
    type: 'university'
  },
  {
    id: 'dhu_sj',
    name: '东华大学 (松江校区)',
    address: '松江区人民北路2999号',
    coordinate: { lat: 31.0545, lng: 121.2115 },
    type: 'university'
  },
  {
    id: 'sufe_wd',
    name: '上海财经大学 (武东路校区)',
    address: '杨浦区武东路100号',
    coordinate: { lat: 31.3065, lng: 121.4965 },
    type: 'university'
  },
  {
    id: 'sufe_gn',
    name: '上海财经大学 (国定路校区)',
    address: '杨浦区国定路777号',
    coordinate: { lat: 31.2995, lng: 121.5015 },
    type: 'university'
  },
  {
    id: 'ecust_xy',
    name: '华东理工大学 (徐汇校区)',
    address: '徐汇区梅陇路130号',
    coordinate: { lat: 31.1425, lng: 121.4255 },
    type: 'university'
  },
  {
    id: 'ecust_fx',
    name: '华东理工大学 (奉贤校区)',
    address: '奉贤区海思路999号',
    coordinate: { lat: 30.8325, lng: 121.5035 },
    type: 'university'
  },
  {
    id: 'shnu_xz',
    name: '上海师范大学 (徐汇校区)',
    address: '徐汇区桂林路100号',
    coordinate: { lat: 31.1885, lng: 121.4255 },
    type: 'university'
  },
  {
    id: 'shnu_fs',
    name: '上海师范大学 (奉贤校区)',
    address: '奉贤区海思路100号',
    coordinate: { lat: 30.8315, lng: 121.5025 },
    type: 'university'
  },
  {
    id: 'shcmu_fs',
    name: '上海音乐学院',
    address: '徐汇区汾阳路20号',
    coordinate: { lat: 31.2175, lng: 121.4555 },
    type: 'university'
  },
  {
    id: 'shnuo_fs',
    name: '上海戏剧学院',
    address: '静安区华山路630号',
    coordinate: { lat: 31.2255, lng: 121.4535 },
    type: 'university'
  },
  {
    id: 'shisu_fs',
    name: '上海体育学院',
    address: '杨浦区清源环路650号',
    coordinate: { lat: 31.3155, lng: 121.5055 },
    type: 'university'
  },
  {
    id: 'shuli_fs',
    name: '上海理工大学',
    address: '杨浦区军工路516号',
    coordinate: { lat: 31.2925, lng: 121.5585 },
    type: 'university'
  },
  {
    id: 'shiep_fs',
    name: '上海电力大学',
    address: '杨浦区平凉路2103号',
    coordinate: { lat: 31.2755, lng: 121.5455 },
    type: 'university'
  },
  {
    id: 'sues_fs',
    name: '上海工程技术大学',
    address: '长宁区仙霞路350号',
    coordinate: { lat: 31.2085, lng: 121.3985 },
    type: 'university'
  },
  {
    id: 'shou_fs',
    name: '上海海洋大学',
    address: '浦东新区沪城环路999号',
    coordinate: { lat: 31.0455, lng: 121.9035 },
    type: 'university'
  },
  {
    id: 'shutcm_fs',
    name: '上海中医药大学',
    address: '浦东新区蔡伦路1200号',
    coordinate: { lat: 31.1955, lng: 121.6035 },
    type: 'university'
  },
  {
    id: 'sus_fs',
    name: '上海海事大学',
    address: '浦东新区海港大道1550号',
    coordinate: { lat: 30.8755, lng: 121.9285 },
    type: 'university'
  },
  {
    id: 'suesp_fs',
    name: '上海第二工业大学',
    address: '浦东新区金海路2360号',
    coordinate: { lat: 31.2655, lng: 121.6285 },
    type: 'university'
  },
  {
    id: 'shpt_fs',
    name: '上海应用技术大学',
    address: '徐汇区漕宝路120号',
    coordinate: { lat: 31.1655, lng: 121.4155 },
    type: 'university'
  },
  {
    id: 'sbs_fs',
    name: '上海商学院',
    address: '徐汇区中山西路2271号',
    coordinate: { lat: 31.1855, lng: 121.4255 },
    type: 'university'
  },
  {
    id: 'shcv_fs',
    name: '上海建桥学院',
    address: '浦东新区沪城环路1111号',
    coordinate: { lat: 31.0555, lng: 121.8985 },
    type: 'university'
  },
  {
    id: 'shvtc_fs',
    name: '上海杉达学院',
    address: '浦东新区金海路2727号',
    coordinate: { lat: 31.2755, lng: 121.6385 },
    type: 'university'
  },
  {
    id: 'siva_fs',
    name: '上海视觉艺术学院',
    address: '松江区文翔路2200号',
    coordinate: { lat: 31.0525, lng: 121.2125 },
    type: 'university'
  },
  {
    id: 'shcm_fs',
    name: '上海海关学院',
    address: '浦东新区华夏西路5677号',
    coordinate: { lat: 31.1755, lng: 121.5785 },
    type: 'university'
  },
  {
    id: 'shgm_fs',
    name: '上海公安学院',
    address: '浦东新区崇景路100号',
    coordinate: { lat: 31.1955, lng: 121.5885 },
    type: 'university'
  },
  {
    id: 'shjg_fs',
    name: '上海健康医学院',
    address: '浦东新区周祝公路279号',
    coordinate: { lat: 31.0955, lng: 121.6285 },
    type: 'university'
  },
  {
    id: 'shjy_fs',
    name: '上海电机学院',
    address: '浦东新区临港新城橄榄路1350号',
    coordinate: { lat: 30.8855, lng: 121.9385 },
    type: 'university'
  },
  {
    id: 'shlg_fs',
    name: '上海立达学院',
    address: '松江区车亭公路1788号',
    coordinate: { lat: 30.9255, lng: 121.3185 },
    type: 'university'
  },
  {
    id: 'shsd_fs',
    name: '上海师范大学天华学院',
    address: '嘉定区胜辛北路1661号',
    coordinate: { lat: 31.3855, lng: 121.2285 },
    type: 'university'
  },
  {
    id: 'shwl_fs',
    name: '上海外国语大学贤达经济人文学院',
    address: '崇明区东滩大道999号',
    coordinate: { lat: 31.6255, lng: 121.3985 },
    type: 'university'
  },
  {
    id: 'shxy_fs',
    name: '上海兴伟学院',
    address: '浦东新区惠南镇城南路1636号',
    coordinate: { lat: 31.0555, lng: 121.7585 },
    type: 'university'
  },
  {
    id: 'shzd_fs',
    name: '上海中侨职业技术大学',
    address: '金山区漕廊公路3888号',
    coordinate: { lat: 30.7455, lng: 121.3585 },
    type: 'university'
  },
  {
    id: 'shkj_fs',
    name: '上海科学技术职业学院',
    address: '嘉定区金沙路280号',
    coordinate: { lat: 31.3855, lng: 121.2485 },
    type: 'university'
  },
  {
    id: 'shgz_fs',
    name: '上海工艺美术职业学院',
    address: '嘉定区嘉行公路851号',
    coordinate: { lat: 31.3955, lng: 121.2585 },
    type: 'university'
  },
  {
    id: 'shny_fs',
    name: '上海农林职业技术学院',
    address: '松江区中山二路658号',
    coordinate: { lat: 31.0355, lng: 121.2285 },
    type: 'university'
  },
  {
    id: 'shhy_fs',
    name: '上海民航职业技术学院',
    address: '徐汇区龙华西路1号',
    coordinate: { lat: 31.1755, lng: 121.4455 },
    type: 'university'
  },
  {
    id: 'shcz_fs',
    name: '上海城建职业学院',
    address: '杨浦区军工路2360号',
    coordinate: { lat: 31.2955, lng: 121.5555 },
    type: 'university'
  },
  {
    id: 'shyy_fs',
    name: '上海旅游高等专科学校',
    address: '奉贤区海思路500号',
    coordinate: { lat: 30.8355, lng: 121.5055 },
    type: 'university'
  },
  {
    id: 'shjp_fs',
    name: '上海出版印刷高等专科学校',
    address: '杨浦区水丰路100号',
    coordinate: { lat: 31.2855, lng: 121.5455 },
    type: 'university'
  },
  {
    id: 'shzy_fs',
    name: '上海电影艺术职业学院',
    address: '浦东新区达尔文路188号',
    coordinate: { lat: 31.1955, lng: 121.6055 },
    type: 'university'
  },
  {
    id: 'shjw_fs',
    name: '上海济光职业技术学院',
    address: '宝山区水产路2859号',
    coordinate: { lat: 31.3255, lng: 121.4855 },
    type: 'university'
  },
  {
    id: 'shms_fs',
    name: '上海民远职业技术学院',
    address: '浦东新区唐陆路3928号',
    coordinate: { lat: 31.2155, lng: 121.6655 },
    type: 'university'
  },
  {
    id: 'shos_fs',
    name: '上海欧华职业技术学院',
    address: '浦东新区沪南公路7658号',
    coordinate: { lat: 31.0455, lng: 121.7685 },
    type: 'university'
  },
  {
    id: 'shsf_fs',
    name: '上海思博职业技术学院',
    address: '浦东新区惠南镇城南路1408号',
    coordinate: { lat: 31.0555, lng: 121.7555 },
    type: 'university'
  },
  {
    id: 'shxd_fs',
    name: '上海东海职业技术学院',
    address: '闵行区虹梅南路6001号',
    coordinate: { lat: 31.0955, lng: 121.4255 },
    type: 'university'
  },
  {
    id: 'shbz_fs',
    name: '上海邦德职业技术学院',
    address: '宝山区锦秋路299号',
    coordinate: { lat: 31.3155, lng: 121.4355 },
    type: 'university'
  },
  {
    id: 'shzx_fs',
    name: '上海中华职业技术学院',
    address: '奉贤区大叶公路5225号',
    coordinate: { lat: 30.8855, lng: 121.4855 },
    type: 'university'
  },
  {
    id: 'shsl_fs',
    name: '上海行健职业学院',
    address: '静安区原平路55号',
    coordinate: { lat: 31.2855, lng: 121.4455 },
    type: 'university'
  },
  {
    id: 'shqg_fs',
    name: '上海工商外国语职业学院',
    address: '浦东新区惠南镇观海路505号',
    coordinate: { lat: 31.0555, lng: 121.7555 },
    type: 'university'
  },
  {
    id: 'shyy_fs',
    name: '上海震旦职业学院',
    address: '宝山区市一路88号',
    coordinate: { lat: 31.3855, lng: 121.4255 },
    type: 'university'
  },
  {
    id: 'shly_fs',
    name: '上海立达学院',
    address: '松江区车亭公路1788号',
    coordinate: { lat: 30.9255, lng: 121.3185 },
    type: 'university'
  },
  {
    id: 'shmy_fs',
    name: '上海民远职业技术学院',
    address: '浦东新区唐陆路3928号',
    coordinate: { lat: 31.2155, lng: 121.6655 },
    type: 'university'
  },
  {
    id: 'shnz_fs',
    name: '上海南湖职业技术学院',
    address: '虹口区三门路693号',
    coordinate: { lat: 31.3055, lng: 121.4855 },
    type: 'university'
  },
  {
    id: 'shsy_fs',
    name: '上海现代化工职业学院',
    address: '金山区龙胜路1097号',
    coordinate: { lat: 30.7455, lng: 121.3585 },
    type: 'university'
  },
  {
    id: 'shhj_fs',
    name: '上海科创职业技术学院',
    address: '松江区人民北路925号',
    coordinate: { lat: 31.0455, lng: 121.2155 },
    type: 'university'
  },
  {
    id: 'shsk_fs',
    name: '上海闵行职业技术学院',
    address: '闵行区元江路4080号',
    coordinate: { lat: 31.0655, lng: 121.4155 },
    type: 'university'
  },
  {
    id: 'shsj_fs',
    name: '上海建设管理职业技术学院',
    address: '青浦区徐泾镇高泾路588号',
    coordinate: { lat: 31.1855, lng: 121.2855 },
    type: 'university'
  },
  {
    id: 'shsz_fs',
    name: '上海浦东职业技术学院',
    address: '浦东新区川沙新镇川周公路2788号',
    coordinate: { lat: 31.1755, lng: 121.7055 },
    type: 'university'
  },
  {
    id: 'shsg_fs',
    name: '上海工艺美术职业学院',
    address: '嘉定区嘉行公路851号',
    coordinate: { lat: 31.3955, lng: 121.2585 },
    type: 'university'
  },
  {
    id: 'shsa_fs',
    name: '上海电子信息职业技术学院',
    address: '奉贤区瓦洪公路3098号',
    coordinate: { lat: 30.9255, lng: 121.5255 },
    type: 'university'
  },
  {
    id: 'shsb_fs',
    name: '上海交通职业技术学院',
    address: '浦东新区下盐路2088号',
    coordinate: { lat: 31.0955, lng: 121.7655 },
    type: 'university'
  },
  {
    id: 'shsc_fs',
    name: '上海农林职业技术学院',
    address: '松江区中山二路658号',
    coordinate: { lat: 31.0355, lng: 121.2285 },
    type: 'university'
  },
  {
    id: 'shsd_fs',
    name: '上海科学技术职业学院',
    address: '嘉定区金沙路280号',
    coordinate: { lat: 31.3855, lng: 121.2485 },
    type: 'university'
  },
  {
    id: 'shse_fs',
    name: '上海工会管理职业学院',
    address: '奉贤区大叶公路5225号',
    coordinate: { lat: 30.8855, lng: 121.4855 },
    type: 'university'
  },
  {
    id: 'shsf_fs',
    name: '上海民航职业技术学院',
    address: '徐汇区龙华西路1号',
    coordinate: { lat: 31.1755, lng: 121.4455 },
    type: 'university'
  },
  {
    id: 'shsg_fs',
    name: '上海体育职业学院',
    address: '徐汇区百色路1333号',
    coordinate: { lat: 31.1555, lng: 121.4355 },
    type: 'university'
  },
  {
    id: 'shsh_fs',
    name: '上海行健职业学院',
    address: '静安区原平路55号',
    coordinate: { lat: 31.2855, lng: 121.4455 },
    type: 'university'
  },
  {
    id: 'shsi_fs',
    name: '上海工商外国语职业学院',
    address: '浦东新区惠南镇观海路505号',
    coordinate: { lat: 31.0555, lng: 121.7555 },
    type: 'university'
  },
  {
    id: 'shsj_fs',
    name: '上海震旦职业学院',
    address: '宝山区市一路88号',
    coordinate: { lat: 31.3855, lng: 121.4255 },
    type: 'university'
  },
  {
    id: 'shsk_fs',
    name: '上海立达学院',
    address: '松江区车亭公路1788号',
    coordinate: { lat: 30.9255, lng: 121.3185 },
    type: 'university'
  },
  {
    id: 'shsl_fs',
    name: '上海民远职业技术学院',
    address: '浦东新区唐陆路3928号',
    coordinate: { lat: 31.2155, lng: 121.6655 },
    type: 'university'
  },
  {
    id: 'shsm_fs',
    name: '上海思博职业技术学院',
    address: '浦东新区惠南镇城南路1408号',
    coordinate: { lat: 31.0555, lng: 121.7555 },
    type: 'university'
  },
  {
    id: 'shsn_fs',
    name: '上海东海职业技术学院',
    address: '闵行区虹梅南路6001号',
    coordinate: { lat: 31.0955, lng: 121.4255 },
    type: 'university'
  },
  {
    id: 'shso_fs',
    name: '上海欧华职业技术学院',
    address: '浦东新区沪南公路7658号',
    coordinate: { lat: 31.0455, lng: 121.7685 },
    type: 'university'
  },
  {
    id: 'shsp_fs',
    name: '上海济光职业技术学院',
    address: '宝山区水产路2859号',
    coordinate: { lat: 31.3255, lng: 121.4855 },
    type: 'university'
  },
  {
    id: 'shsq_fs',
    name: '上海邦德职业技术学院',
    address: '宝山区锦秋路299号',
    coordinate: { lat: 31.3155, lng: 121.4355 },
    type: 'university'
  },
  {
    id: 'shsr_fs',
    name: '上海中华职业技术学院',
    address: '奉贤区大叶公路5225号',
    coordinate: { lat: 30.8855, lng: 121.4855 },
    type: 'university'
  },
  {
    id: 'shss_fs',
    name: '上海南湖职业技术学院',
    address: '虹口区三门路693号',
    coordinate: { lat: 31.3055, lng: 121.4855 },
    type: 'university'
  },
  {
    id: 'shst_fs',
    name: '上海科创职业技术学院',
    address: '松江区人民北路925号',
    coordinate: { lat: 31.0455, lng: 121.2155 },
    type: 'university'
  },
  {
    id: 'shsu_fs',
    name: '上海闵行职业技术学院',
    address: '闵行区元江路4080号',
    coordinate: { lat: 31.0655, lng: 121.4155 },
    type: 'university'
  },
  {
    id: 'shsv_fs',
    name: '上海建设管理职业技术学院',
    address: '青浦区徐泾镇高泾路588号',
    coordinate: { lat: 31.1855, lng: 121.2855 },
    type: 'university'
  },
  {
    id: 'shsw_fs',
    name: '上海浦东职业技术学院',
    address: '浦东新区川沙新镇川周公路2788号',
    coordinate: { lat: 31.1755, lng: 121.7055 },
    type: 'university'
  },
  {
    id: 'shsx_fs',
    name: '上海现代化工职业学院',
    address: '金山区龙胜路1097号',
    coordinate: { lat: 30.7455, lng: 121.3585 },
    type: 'university'
  },
  {
    id: 'shsy_fs',
    name: '上海电子信息职业技术学院',
    address: '奉贤区瓦洪公路3098号',
    coordinate: { lat: 30.9255, lng: 121.5255 },
    type: 'university'
  },
  {
    id: 'shsz_fs',
    name: '上海交通职业技术学院',
    address: '浦东新区下盐路2088号',
    coordinate: { lat: 31.0955, lng: 121.7655 },
    type: 'university'
  },
  {
    id: 'shta_fs',
    name: '上海工会管理职业学院',
    address: '奉贤区大叶公路5225号',
    coordinate: { lat: 30.8855, lng: 121.4855 },
    type: 'university'
  },
  {
    id: 'shtb_fs',
    name: '上海体育职业学院',
    address: '徐汇区百色路1333号',
    coordinate: { lat: 31.1555, lng: 121.4355 },
    type: 'university'
  },
  {
    id: 'shtc_fs',
    name: '上海工艺美术职业学院',
    address: '嘉定区嘉行公路851号',
    coordinate: { lat: 31.3955, lng: 121.2585 },
    type: 'university'
  },
  {
    id: 'shtd_fs',
    name: '上海旅游高等专科学校',
    address: '奉贤区海思路500号',
    coordinate: { lat: 30.8355, lng: 121.5055 },
    type: 'university'
  },
  {
    id: 'shte_fs',
    name: '上海出版印刷高等专科学校',
    address: '杨浦区水丰路100号',
    coordinate: { lat: 31.2855, lng: 121.5455 },
    type: 'university'
  },
  {
    id: 'shtf_fs',
    name: '上海电影艺术职业学院',
    address: '浦东新区达尔文路188号',
    coordinate: { lat: 31.1955, lng: 121.6055 },
    type: 'university'
  },
  {
    id: 'shtg_fs',
    name: '上海农林职业技术学院',
    address: '松江区中山二路658号',
    coordinate: { lat: 31.0355, lng: 121.2285 },
    type: 'university'
  },
  {
    id: 'shth_fs',
    name: '上海科学技术职业学院',
    address: '嘉定区金沙路280号',
    coordinate: { lat: 31.3855, lng: 121.2485 },
    type: 'university'
  },
  {
    id: 'shti_fs',
    name: '上海民航职业技术学院',
    address: '徐汇区龙华西路1号',
    coordinate: { lat: 31.1755, lng: 121.4455 },
    type: 'university'
  },
  {
    id: 'shtj_fs',
    name: '上海城建职业学院',
    address: '杨浦区军工路2360号',
    coordinate: { lat: 31.2955, lng: 121.5555 },
    type: 'university'
  },
  {
    id: 'shtk_fs',
    name: '上海交通职业技术学院',
    address: '浦东新区下盐路2088号',
    coordinate: { lat: 31.0955, lng: 121.7655 },
    type: 'university'
  },
  {
    id: 'shtl_fs',
    name: '上海东海职业技术学院',
    address: '闵行区虹梅南路6001号',
    coordinate: { lat: 31.0955, lng: 121.4255 },
    type: 'university'
  },
  {
    id: 'shtm_fs',
    name: '上海工商外国语职业学院',
    address: '浦东新区惠南镇观海路505号',
    coordinate: { lat: 31.0555, lng: 121.7555 },
    type: 'university'
  },
  {
    id: 'shtn_fs',
    name: '上海行健职业学院',
    address: '静安区原平路55号',
    coordinate: { lat: 31.2855, lng: 121.4455 },
    type: 'university'
  },
  {
    id: 'shto_fs',
    name: '上海震旦职业学院',
    address: '宝山区市一路88号',
    coordinate: { lat: 31.3855, lng: 121.4255 },
    type: 'university'
  },
  {
    id: 'shtp_fs',
    name: '上海立达学院',
    address: '松江区车亭公路1788号',
    coordinate: { lat: 30.9255, lng: 121.3185 },
    type: 'university'
  },
  {
    id: 'shtq_fs',
    name: '上海民远职业技术学院',
    address: '浦东新区唐陆路3928号',
    coordinate: { lat: 31.2155, lng: 121.6655 },
    type: 'university'
  },
  {
    id: 'shtr_fs',
    name: '上海思博职业技术学院',
    address: '浦东新区惠南镇城南路1408号',
    coordinate: { lat: 31.0555, lng: 121.7555 },
    type: 'university'
  },
  {
    id: 'shts_fs',
    name: '上海欧华职业技术学院',
    address: '浦东新区沪南公路7658号',
    coordinate: { lat: 31.0455, lng: 121.7685 },
    type: 'university'
  },
  {
    id: 'shtt_fs',
    name: '上海济光职业技术学院',
    address: '宝山区水产路2859号',
    coordinate: { lat: 31.3255, lng: 121.4855 },
    type: 'university'
  },
  {
    id: 'shtu_fs',
    name: '上海邦德职业技术学院',
    address: '宝山区锦秋路299号',
    coordinate: { lat: 31.3155, lng: 121.4355 },
    type: 'university'
  },
  {
    id: 'shtv_fs',
    name: '上海中华职业技术学院',
    address: '奉贤区大叶公路5225号',
    coordinate: { lat: 30.8855, lng: 121.4855 },
    type: 'university'
  },
  {
    id: 'shtw_fs',
    name: '上海南湖职业技术学院',
    address: '虹口区三门路693号',
    coordinate: { lat: 31.3055, lng: 121.4855 },
    type: 'university'
  },
  {
    id: 'shtx_fs',
    name: '上海科创职业技术学院',
    address: '松江区人民北路925号',
    coordinate: { lat: 31.0455, lng: 121.2155 },
    type: 'university'
  },
  {
    id: 'shty_fs',
    name: '上海闵行职业技术学院',
    address: '闵行区元江路4080号',
    coordinate: { lat: 31.0655, lng: 121.4155 },
    type: 'university'
  },
  {
    id: 'shtz_fs',
    name: '上海建设管理职业技术学院',
    address: '青浦区徐泾镇高泾路588号',
    coordinate: { lat: 31.1855, lng: 121.2855 },
    type: 'university'
  },
  {
    id: 'shua_fs',
    name: '上海浦东职业技术学院',
    address: '浦东新区川沙新镇川周公路2788号',
    coordinate: { lat: 31.1755, lng: 121.7055 },
    type: 'university'
  },
  {
    id: 'shub_fs',
    name: '上海现代化工职业学院',
    address: '金山区龙胜路1097号',
    coordinate: { lat: 30.7455, lng: 121.3585 },
    type: 'university'
  },
  {
    id: 'shuc_fs',
    name: '上海电子信息职业技术学院',
    address: '奉贤区瓦洪公路3098号',
    coordinate: { lat: 30.9255, lng: 121.5255 },
    type: 'university'
  },
  {
    id: 'shud_fs',
    name: '上海交通职业技术学院',
    address: '浦东新区下盐路2088号',
    coordinate: { lat: 31.0955, lng: 121.7655 },
    type: 'university'
  },
  {
    id: 'shue_fs',
    name: '上海工会管理职业学院',
    address: '奉贤区大叶公路5225号',
    coordinate: { lat: 30.8855, lng: 121.4855 },
    type: 'university'
  },
  {
    id: 'shuf_fs',
    name: '上海体育职业学院',
    address: '徐汇区百色路1333号',
    coordinate: { lat: 31.1555, lng: 121.4355 },
    type: 'university'
  },
  {
    id: 'shug_fs',
    name: '上海工艺美术职业学院',
    address: '嘉定区嘉行公路851号',
    coordinate: { lat: 31.3955, lng: 121.2585 },
    type: 'university'
  },
  {
    id: 'shuh_fs',
    name: '上海旅游高等专科学校',
    address: '奉贤区海思路500号',
    coordinate: { lat: 30.8355, lng: 121.5055 },
    type: 'university'
  },
  {
    id: 'shui_fs',
    name: '上海出版印刷高等专科学校',
    address: '杨浦区水丰路100号',
    coordinate: { lat: 31.2855, lng: 121.5455 },
    type: 'university'
  },
  {
    id: 'shuj_fs',
    name: '上海电影艺术职业学院',
    address: '浦东新区达尔文路188号',
    coordinate: { lat: 31.1955, lng: 121.6055 },
    type: 'university'
  },
  {
    id: 'shuk_fs',
    name: '上海农林职业技术学院',
    address: '松江区中山二路658号',
    coordinate: { lat: 31.0355, lng: 121.2285 },
    type: 'university'
  },
  {
    id: 'shul_fs',
    name: '上海科学技术职业学院',
    address: '嘉定区金沙路280号',
    coordinate: { lat: 31.3855, lng: 121.2485 },
    type: 'university'
  },
  {
    id: 'shum_fs',
    name: '上海民航职业技术学院',
    address: '徐汇区龙华西路1号',
    coordinate: { lat: 31.1755, lng: 121.4455 },
    type: 'university'
  },
  {
    id: 'shun_fs',
    name: '上海城建职业学院',
    address: '杨浦区军工路2360号',
    coordinate: { lat: 31.2955, lng: 121.5555 },
    type: 'university'
  },
  {
    id: 'shuo_fs',
    name: '上海交通职业技术学院',
    address: '浦东新区下盐路2088号',
    coordinate: { lat: 31.0955, lng: 121.7655 },
    type: 'university'
  },
  {
    id: 'shup_fs',
    name: '上海东海职业技术学院',
    address: '闵行区虹梅南路6001号',
    coordinate: { lat: 31.0955, lng: 121.4255 },
    type: 'university'
  },
  {
    id: 'shuq_fs',
    name: '上海工商外国语职业学院',
    address: '浦东新区惠南镇观海路505号',
    coordinate: { lat: 31.0555, lng: 121.7555 },
    type: 'university'
  },
  {
    id: 'shur_fs',
    name: '上海行健职业学院',
    address: '静安区原平路55号',
    coordinate: { lat: 31.2855, lng: 121.4455 },
    type: 'university'
  },
  {
    id: 'shus_fs',
    name: '上海震旦职业学院',
    address: '宝山区市一路88号',
    coordinate: { lat: 31.3855, lng: 121.4255 },
    type: 'university'
  },
  {
    id: 'shut_fs',
    name: '上海立达学院',
    address: '松江区车亭公路1788号',
    coordinate: { lat: 30.9255, lng: 121.3185 },
    type: 'university'
  },
  {
    id: 'shuu_fs',
    name: '上海民远职业技术学院',
    address: '浦东新区唐陆路3928号',
    coordinate: { lat: 31.2155, lng: 121.6655 },
    type: 'university'
  },
  {
    id: 'shuv_fs',
    name: '上海思博职业技术学院',
    address: '浦东新区惠南镇城南路1408号',
    coordinate: { lat: 31.0555, lng: 121.7555 },
    type: 'university'
  },
  {
    id: 'shuw_fs',
    name: '上海欧华职业技术学院',
    address: '浦东新区沪南公路7658号',
    coordinate: { lat: 31.0455, lng: 121.7685 },
    type: 'university'
  },
  {
    id: 'shux_fs',
    name: '上海济光职业技术学院',
    address: '宝山区水产路2859号',
    coordinate: { lat: 31.3255, lng: 121.4855 },
    type: 'university'
  },
  {
    id: 'shuy_fs',
    name: '上海邦德职业技术学院',
    address: '宝山区锦秋路299号',
    coordinate: { lat: 31.3155, lng: 121.4355 },
    type: 'university'
  },
  {
    id: 'shuz_fs',
    name: '上海中华职业技术学院',
    address: '奉贤区大叶公路5225号',
    coordinate: { lat: 30.8855, lng: 121.4855 },
    type: 'university'
  },
  {
    id: 'shva_fs',
    name: '上海南湖职业技术学院',
    address: '虹口区三门路693号',
    coordinate: { lat: 31.3055, lng: 121.4855 },
    type: 'university'
  },
  {
    id: 'shvb_fs',
    name: '上海科创职业技术学院',
    address: '松江区人民北路925号',
    coordinate: { lat: 31.0455, lng: 121.2155 },
    type: 'university'
  },
  {
    id: 'shvc_fs',
    name: '上海闵行职业技术学院',
    address: '闵行区元江路4080号',
    coordinate: { lat: 31.0655, lng: 121.4155 },
    type: 'university'
  },
  {
    id: 'shvd_fs',
    name: '上海建设管理职业技术学院',
    address: '青浦区徐泾镇高泾路588号',
    coordinate: { lat: 31.1855, lng: 121.2855 },
    type: 'university'
  },
  {
    id: 'shve_fs',
    name: '上海浦东职业技术学院',
    address: '浦东新区川沙新镇川周公路2788号',
    coordinate: { lat: 31.1755, lng: 121.7055 },
    type: 'university'
  },
  {
    id: 'shvf_fs',
    name: '上海现代化工职业学院',
    address: '金山区龙胜路1097号',
    coordinate: { lat: 30.7455, lng: 121.3585 },
    type: 'university'
  },
  {
    id: 'shvg_fs',
    name: '上海电子信息职业技术学院',
    address: '奉贤区瓦洪公路3098号',
    coordinate: { lat: 30.9255, lng: 121.5255 },
    type: 'university'
  },
  {
    id: 'shvh_fs',
    name: '上海交通职业技术学院',
    address: '浦东新区下盐路2088号',
    coordinate: { lat: 31.0955, lng: 121.7655 },
    type: 'university'
  },
  {
    id: 'shvi_fs',
    name: '上海工会管理职业学院',
    address: '奉贤区大叶公路5225号',
    coordinate: { lat: 30.8855, lng: 121.4855 },
    type: 'university'
  },
  {
    id: 'shvj_fs',
    name: '上海体育职业学院',
    address: '徐汇区百色路1333号',
    coordinate: { lat: 31.1555, lng: 121.4355 },
    type: 'university'
  },
  {
    id: 'shvk_fs',
    name: '上海工艺美术职业学院',
    address: '嘉定区嘉行公路851号',
    coordinate: { lat: 31.3955, lng: 121.2585 },
    type: 'university'
  },
  {
    id: 'shvl_fs',
    name: '上海旅游高等专科学校',
    address: '奉贤区海思路500号',
    coordinate: { lat: 30.8355, lng: 121.5055 },
    type: 'university'
  },
  {
    id: 'shvm_fs',
    name: '上海出版印刷高等专科学校',
    address: '杨浦区水丰路100号',
    coordinate: { lat: 31.2855, lng: 121.5455 },
    type: 'university'
  },
  {
    id: 'shvn_fs',
    name: '上海电影艺术职业学院',
    address: '浦东新区达尔文路188号',
    coordinate: { lat: 31.1955, lng: 121.6055 },
    type: 'university'
  },
  {
    id: 'shvo_fs',
    name: '上海农林职业技术学院',
    address: '松江区中山二路658号',
    coordinate: { lat: 31.0355, lng: 121.2285 },
    type: 'university'
  },
  {
    id: 'shvp_fs',
    name: '上海科学技术职业学院',
    address: '嘉定区金沙路280号',
    coordinate: { lat: 31.3855, lng: 121.2485 },
    type: 'university'
  },
  {
    id: 'shvq_fs',
    name: '上海民航职业技术学院',
    address: '徐汇区龙华西路1号',
    coordinate: { lat: 31.1755, lng: 121.4455 },
    type: 'university'
  },
  {
    id: 'shvr_fs',
    name: '上海城建职业学院',
    address: '杨浦区军工路2360号',
    coordinate: { lat: 31.2955, lng: 121.5555 },
    type: 'university'
  },
  {
    id: 'shvs_fs',
    name: '上海交通职业技术学院',
    address: '浦东新区下盐路2088号',
    coordinate: { lat: 31.0955, lng: 121.7655 },
    type: 'university'
  },
  {
    id: 'shvt_fs',
    name: '上海东海职业技术学院',
    address: '闵行区虹梅南路6001号',
    coordinate: { lat: 31.0955, lng: 121.4255 },
    type: 'university'
  },
  {
    id: 'shvu_fs',
    name: '上海工商外国语职业学院',
    address: '浦东新区惠南镇观海路505号',
    coordinate: { lat: 31.0555, lng: 121.7555 },
    type: 'university'
  },
  {
    id: 'shvv_fs',
    name: '上海行健职业学院',
    address: '静安区原平路55号',
    coordinate: { lat: 31.2855, lng: 121.4455 },
    type: 'university'
  },
  {
    id: 'shvw_fs',
    name: '上海震旦职业学院',
    address: '宝山区市一路88号',
    coordinate: { lat: 31.3855, lng: 121.4255 },
    type: 'university'
  },
  {
    id: 'shvx_fs',
    name: '上海立达学院',
    address: '松江区车亭公路1788号',
    coordinate: { lat: 30.9255, lng: 121.3185 },
    type: 'university'
  },
  {
    id: 'shvy_fs',
    name: '上海民远职业技术学院',
    address: '浦东新区唐陆路3928号',
    coordinate: { lat: 31.2155, lng: 121.6655 },
    type: 'university'
  },
  {
    id: 'shvz_fs',
    name: '上海思博职业技术学院',
    address: '浦东新区惠南镇城南路1408号',
    coordinate: { lat: 31.0555, lng: 121.7555 },
    type: 'university'
  },
  {
    id: 'shwa_fs',
    name: '上海欧华职业技术学院',
    address: '浦东新区沪南公路7658号',
    coordinate: { lat: 31.0455, lng: 121.7685 },
    type: 'university'
  },
  {
    id: 'shwb_fs',
    name: '上海济光职业技术学院',
    address: '宝山区水产路2859号',
    coordinate: { lat: 31.3255, lng: 121.4855 },
    type: 'university'
  },
  {
    id: 'shwc_fs',
    name: '上海邦德职业技术学院',
    address: '宝山区锦秋路299号',
    coordinate: { lat: 31.3155, lng: 121.4355 },
    type: 'university'
  },
  {
    id: 'shwd_fs',
    name: '上海中华职业技术学院',
    address: '奉贤区大叶公路5225号',
    coordinate: { lat: 30.8855, lng: 121.4855 },
    type: 'university'
  },
  {
    id: 'shwe_fs',
    name: '上海南湖职业技术学院',
    address: '虹口区三门路693号',
    coordinate: { lat: 31.3055, lng: 121.4855 },
    type: 'university'
  },
  {
    id: 'shwf_fs',
    name: '上海科创职业技术学院',
    address: '松江区人民北路925号',
    coordinate: { lat: 31.0455, lng: 121.2155 },
    type: 'university'
  },
  {
    id: 'shwg_fs',
    name: '上海闵行职业技术学院',
    address: '闵行区元江路4080号',
    coordinate: { lat: 31.0655, lng: 121.4155 },
    type: 'university'
  },
  {
    id: 'shwh_fs',
    name: '上海建设管理职业技术学院',
    address: '青浦区徐泾镇高泾路588号',
    coordinate: { lat: 31.1855, lng: 121.2855 },
    type: 'university'
  },
  {
    id: 'shwi_fs',
    name: '上海浦东职业技术学院',
    address: '浦东新区川沙新镇川周公路2788号',
    coordinate: { lat: 31.1755, lng: 121.7055 },
    type: 'university'
  },
  {
    id: 'shwj_fs',
    name: '上海现代化工职业学院',
    address: '金山区龙胜路1097号',
    coordinate: { lat: 30.7455, lng: 121.3585 },
    type: 'university'
  },
  {
    id: 'shwk_fs',
    name: '上海电子信息职业技术学院',
    address: '奉贤区瓦洪公路3098号',
    coordinate: { lat: 30.9255, lng: 121.5255 },
    type: 'university'
  },
  {
    id: 'shwl_fs',
    name: '上海交通职业技术学院',
    address: '浦东新区下盐路2088号',
    coordinate: { lat: 31.0955, lng: 121.7655 },
    type: 'university'
  },
  {
    id: 'shwm_fs',
    name: '上海工会管理职业学院',
    address: '奉贤区大叶公路5225号',
    coordinate: { lat: 30.8855, lng: 121.4855 },
    type: 'university'
  },
  {
    id: 'shwn_fs',
    name: '上海体育职业学院',
    address: '徐汇区百色路1333号',
    coordinate: { lat: 31.1555, lng: 121.4355 },
    type: 'university'
  },
  {
    id: 'shwo_fs',
    name: '上海工艺美术职业学院',
    address: '嘉定区嘉行公路851号',
    coordinate: { lat: 31.3955, lng: 121.2585 },
    type: 'university'
  },
  {
    id: 'shwp_fs',
    name: '上海旅游高等专科学校',
    address: '奉贤区海思路500号',
    coordinate: { lat: 30.8355, lng: 121.5055 },
    type: 'university'
  },
  {
    id: 'shwq_fs',
    name: '上海出版印刷高等专科学校',
    address: '杨浦区水丰路100号',
    coordinate: { lat: 31.2855, lng: 121.5455 },
    type: 'university'
  },
  {
    id: 'shwr_fs',
    name: '上海电影艺术职业学院',
    address: '浦东新区达尔文路188号',
    coordinate: { lat: 31.1955, lng: 121.6055 },
    type: 'university'
  },
  {
    id: 'shws_fs',
    name: '上海农林职业技术学院',
    address: '松江区中山二路658号',
    coordinate: { lat: 31.0355, lng: 121.2285 },
    type: 'university'
  },
  {
    id: 'shwt_fs',
    name: '上海科学技术职业学院',
    address: '嘉定区金沙路280号',
    coordinate: { lat: 31.3855, lng: 121.2485 },
    type: 'university'
  },
  {
    id: 'shwu_fs',
    name: '上海民航职业技术学院',
    address: '徐汇区龙华西路1号',
    coordinate: { lat: 31.1755, lng: 121.4455 },
    type: 'university'
  },
  {
    id: 'shwv_fs',
    name: '上海城建职业学院',
    address: '杨浦区军工路2360号',
    coordinate: { lat: 31.2955, lng: 121.5555 },
    type: 'university'
  },
  {
    id: 'shww_fs',
    name: '上海交通职业技术学院',
    address: '浦东新区下盐路2088号',
    coordinate: { lat: 31.0955, lng: 121.7655 },
    type: 'university'
  },
  {
    id: 'shwx_fs',
    name: '上海东海职业技术学院',
    address: '闵行区虹梅南路6001号',
    coordinate: { lat: 31.0955, lng: 121.4255 },
    type: 'university'
  },
  {
    id: 'shwy_fs',
    name: '上海工商外国语职业学院',
    address: '浦东新区惠南镇观海路505号',
    coordinate: { lat: 31.0555, lng: 121.7555 },
    type: 'university'
  },
  {
    id: 'shwz_fs',
    name: '上海行健职业学院',
    address: '静安区原平路55号',
    coordinate: { lat: 31.2855, lng: 121.4455 },
    type: 'university'
  },
  {
    id: 'shxa_fs',
    name: '上海震旦职业学院',
    address: '宝山区市一路88号',
    coordinate: { lat: 31.3855, lng: 121.4255 },
    type: 'university'
  },
  {
    id: 'shxb_fs',
    name: '上海立达学院',
    address: '松江区车亭公路1788号',
    coordinate: { lat: 30.9255, lng: 121.3185 },
    type: 'university'
  },
  {
    id: 'shxc_fs',
    name: '上海民远职业技术学院',
    address: '浦东新区唐陆路3928号',
    coordinate: { lat: 31.2155, lng: 121.6655 },
    type: 'university'
  },
  {
    id: 'shxd_fs',
    name: '上海思博职业技术学院',
    address: '浦东新区惠南镇城南路1408号',
    coordinate: { lat: 31.0555, lng: 121.7555 },
    type: 'university'
  },
  {
    id: 'shxe_fs',
    name: '上海欧华职业技术学院',
    address: '浦东新区沪南公路7658号',
    coordinate: { lat: 31.0455, lng: 121.7685 },
    type: 'university'
  },
  {
    id: 'shxf_fs',
    name: '上海济光职业技术学院',
    address: '宝山区水产路2859号',
    coordinate: { lat: 31.3255, lng: 121.4855 },
    type: 'university'
  },
  {
    id: 'shxg_fs',
    name: '上海邦德职业技术学院',
    address: '宝山区锦秋路299号',
    coordinate: { lat: 31.3155, lng: 121.4355 },
    type: 'university'
  },
  {
    id: 'shxh_fs',
    name: '上海中华职业技术学院',
    address: '奉贤区大叶公路5225号',
    coordinate: { lat: 30.8855, lng: 121.4855 },
    type: 'university'
  },
  {
    id: 'shxi_fs',
    name: '上海南湖职业技术学院',
    address: '虹口区三门路693号',
    coordinate: { lat: 31.3055, lng: 121.4855 },
    type: 'university'
  },
  {
    id: 'shxj_fs',
    name: '上海科创职业技术学院',
    address: '松江区人民北路925号',
    coordinate: { lat: 31.0455, lng: 121.2155 },
    type: 'university'
  },
  {
    id: 'shxk_fs',
    name: '上海闵行职业技术学院',
    address: '闵行区元江路4080号',
    coordinate: { lat: 31.0655, lng: 121.4155 },
    type: 'university'
  },
  {
    id: 'shxl_fs',
    name: '上海建设管理职业技术学院',
    address: '青浦区徐泾镇高泾路588号',
    coordinate: { lat: 31.1855, lng: 121.2855 },
    type: 'university'
  },
  {
    id: 'shxm_fs',
    name: '上海浦东职业技术学院',
    address: '浦东新区川沙新镇川周公路2788号',
    coordinate: { lat: 31.1755, lng: 121.7055 },
    type: 'university'
  },
  {
    id: 'shxn_fs',
    name: '上海现代化工职业学院',
    address: '金山区龙胜路1097号',
    coordinate: { lat: 30.7455, lng: 121.3585 },
    type: 'university'
  },
  {
    id: 'shxo_fs',
    name: '上海电子信息职业技术学院',
    address: '奉贤区瓦洪公路3098号',
    coordinate: { lat: 30.9255, lng: 121.5255 },
    type: 'university'
  },
  {
    id: 'shxp_fs',
    name: '上海交通职业技术学院',
    address: '浦东新区下盐路2088号',
    coordinate: { lat: 31.0955, lng: 121.7655 },
    type: 'university'
  },
  {
    id: 'shxq_fs',
    name: '上海工会管理职业学院',
    address: '奉贤区大叶公路5225号',
    coordinate: { lat: 30.8855, lng: 121.4855 },
    type: 'university'
  },
  {
    id: 'shxr_fs',
    name: '上海体育职业学院',
    address: '徐汇区百色路1333号',
    coordinate: { lat: 31.1555, lng: 121.4355 },
    type: 'university'
  },
  {
    id: 'shxs_fs',
    name: '上海工艺美术职业学院',
    address: '嘉定区嘉行公路851号',
    coordinate: { lat: 31.3955, lng: 121.2585 },
    type: 'university'
  },
  {
    id: 'shxt_fs',
    name: '上海旅游高等专科学校',
    address: '奉贤区海思路500号',
    coordinate: { lat: 30.8355, lng: 121.5055 },
    type: 'university'
  },
  {
    id: 'shxu_fs',
    name: '上海出版印刷高等专科学校',
    address: '杨浦区水丰路100号',
    coordinate: { lat: 31.2855, lng: 121.5455 },
    type: 'university'
  },
  {
    id: 'shxv_fs',
    name: '上海电影艺术职业学院',
    address: '浦东新区达尔文路188号',
    coordinate: { lat: 31.1955, lng: 121.6055 },
    type: 'university'
  },
  {
    id: 'shxw_fs',
    name: '上海农林职业技术学院',
    address: '松江区中山二路658号',
    coordinate: { lat: 31.0355, lng: 121.2285 },
    type: 'university'
  },
  {
    id: 'shxx_fs',
    name: '上海科学技术职业学院',
    address: '嘉定区金沙路280号',
    coordinate: { lat: 31.3855, lng: 121.2485 },
    type: 'university'
  },
  {
    id: 'shxy_fs',
    name: '上海民航职业技术学院',
    address: '徐汇区龙华西路1号',
    coordinate: { lat: 31.1755, lng: 121.4455 },
    type: 'university'
  },
  {
    id: 'shxz_fs',
    name: '上海城建职业学院',
    address: '杨浦区军工路2360号',
    coordinate: { lat: 31.2955, lng: 121.5555 },
    type: 'university'
  },
  {
    id: 'shya_fs',
    name: '上海交通职业技术学院',
    address: '浦东新区下盐路2088号',
    coordinate: { lat: 31.0955, lng: 121.7655 },
    type: 'university'
  },
  {
    id: 'shyb_fs',
    name: '上海东海职业技术学院',
    address: '闵行区虹梅南路6001号',
    coordinate: { lat: 31.0955, lng: 121.4255 },
    type: 'university'
  }
];

// Seed orders for initial data - empty by default, admin will add orders through backend
export const SEED_ORDERS: Order[] = [];
