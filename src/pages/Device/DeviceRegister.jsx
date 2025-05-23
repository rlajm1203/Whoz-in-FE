import React, { useState, useEffect, useRef } from "react"
import { styled } from "styled-components";
import { UpperMessage } from "../../components/StyledComponents/LayoutStyles";
import {
  ContentWrapper,
  ContentContainer,
} from "../../components/StyledComponents/LayoutStyles";
import Modals from "../../components/modal/Modals"
import DeviceRegisterStepper from "../../components/DeviceRegisterStepper.jsx";
import { useNavigate } from "react-router-dom"
import { customFetch } from "../../api/customFetch"

// ❗️TODO: 이 페이지 백엔드에서 템플릿 엔진으로 제공해야 함 network-api와 너무 많이 묶여있음!!!!!
// ❗️그리고 너무 스파게티임

// 환경 변수에서 API 기본 URL 가져오기
const BASE_URL = process.env.REACT_APP_BACKEND_BASEURL;
const IP_LIST = process.env.REACT_APP_IP_LIST.split(",");

// const UpperMessage = styled.div`
//   font-size: 1.5rem;
//   font-weight: bold;
//   text-align: center;
//   margin-bottom: 1.5rem;
// `;q

const RegisterButton = styled.button`
  margin-top: 1rem;
  padding: 0.7rem;
  font-size: 1rem;
  background-color: ${({ disabled }) => (disabled ? "#ccc" : "#1976D2")};
  color: white;
  border: none;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  width: 100%;
`;

export default function DeviceRegister() {
  const [ssids, setSsids] = useState([]); // 모든 SSID 리스트
  const [registeredWifi, setRegisteredWifi] = useState([]); // 등록된 SSID 목록
  const [currentStep, setCurrentStep] = useState(0); // 현재 단계
  const [deviceName, setDeviceName] = useState(""); // 기기 이름
  const navigate = useNavigate();
  const abortControllerRef = useRef(null);
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("device_register_token"); // 쿼리스트링에서 token 값 가져오기
  const [modal, setModal] = useState(null);
  const ssidHintRef = useRef(null);

  // SSID 리스트 불러오기
  useEffect(() => {
    customFetch(`${BASE_URL}/api/v1/ssid`, {
      method: "GET",
      headers: {"Authorization": `Bearer ${token}`}
    })
    .then(response=> response.json())
    .then((data) => {
      if (data.data) {
        setSsids(data.data);
      }
    })
    .catch((err) => console.error("SSID 불러오기 실패:", err));
  }, []);

  // 가장 빠른 IP 응답을 받기 위한 함수
  const fetchFastestIP = async () => {
    // const abortControllers = IP_LIST.map(() => new AbortController());
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const fetchPromises = IP_LIST.map((ip, index) =>
          customFetch(`${ip}/api/v1/my-ip`, { signal: abortControllerRef.current.signal})
          .then((res) => {
            if (!res.ok) {
              throw new Error(`HTTP ${res.status}`);
            }
            return res.text();
          })
          .then((data) => ({ ip: data}))
          .catch((error) => {
            if (error.name === "AbortError") {
              // 요청이 취소된 경우 무시
              return null;
            }
            throw error; // 다른 네트워크 에러는 정상적으로 throw
          })
      );

      const fastestResponse = await Promise.any(fetchPromises.filter(Boolean));
      return fastestResponse.ip;
    } catch (error) {
      console.error("IP 요청 실패:", error);
      return null;
    }
  };

  // 내부 IP를 기반으로 기기 등록 요청
  const registerWifi = async () => {
    const internalIp = await fetchFastestIP(abortControllerRef);
    if (!internalIp) return;

    try {
      const response = await customFetch(`${BASE_URL}/api/v1/device/info`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}`},
        body: JSON.stringify({ ip: internalIp, ssid_hint: ssidHintRef.current  }),
      });
      const json = await response.json();

      if ([ '3030', '3020', '3033', '2001' ].includes(json.error_code)) {
        setModal({
          type: "OK",
          message: json.message,
          onOk: () => {
            setModal(null);
            window.history.back();
          },
        });
        return;
      }

      const status = json.data.status;
      const wifiList = json.data.ssids;
      if (status === "MULTIPLE_CANDIDATES" && !wifiList.includes(ssidHintRef.current)) {
        setModal({
          type: "SELECT",
          message: "현재 어떤 와이파이에 연결되어있나요?",
          actions: json.data.ssids.map((ssid) => ({
            label: ssid,
            onClick: () => {
              ssidHintRef.current = ssid;
              setModal(null);
            },
          })),
        });
        return;
      }

      if (status === "ADDED") {
        ssidHintRef.current = null
      }

      if (Array.isArray(wifiList)) {
        setRegisteredWifi((prev) => {
          const newWifis = wifiList.filter((wifi) => !prev.includes(wifi));
          if (newWifis.length > 0) {
            setCurrentStep((prev) => prev + newWifis.length);
            return [...prev, ...newWifis];
          }
          return prev;
        });
      }
    } catch (error) {
      console.error("기기 맥 등록 실패:", error);
    }
  };

  // 기기 최종 등록 요청
  const registerDevice = async () => {
    if (deviceName.trim().length === 0) return;

    try {
      const response = await customFetch(`${BASE_URL}/api/v1/device`, {
        method: "POST",
        headers: { "Content-Type": "application/json" , "Authorization": `Bearer ${token}`},
        body: JSON.stringify({ device_name: deviceName }),
      });
      const data = await response.json();

      if ([ '2001', '3031' ].includes(data.error_code)) {
        setModal({
          type: "OK",
          message: data.message,
          onOk: () => {
            setModal(null);
            window.history.back();
          },
        });
        return;
      }

      if (response.status === 200 || response.status === 201) {
        setModal({
          type: "OK",
          message: "기기 등록이 완료되었습니다!",
          onOk: () => {
            setModal(null);
            window.location.href = process.env.REACT_APP_FRONTEND_BASEURL + '/main';
          },
        });
      }

    } catch (error) {
      console.error("기기 등록 요청 실패:", error);
    }
  };

  useEffect(() => {
    let timeoutId;
    let pingIntervalId;
    let mdnsIntervalId;
    let ipIntervalId;

    const isInDongbang = async () => {
      try {
        timeoutId = setTimeout(() => {
          setModal({
            type: "OK",
            message:
                "동아리방 서버에 접근할 수 없습니다. 아래 사항들을 점검해보세요.\n" +
                "1. 로컬 네트워크 요청이 거부되어있나요? 허용하고 브라우저를 재시작해주세요.\n" +
                "2. vpn이나 icloud 비공개 릴레이가 켜져있나요? 비활성화해주세요.",
            onOk: () => {
              setModal(null);
              window.history.back();
            },
          });
        }, 3000);

        // IP 요청을 병렬 실행하고, 가장 빠른 응답을 받음
        const fetchPromises = IP_LIST.map((ip) =>
            customFetch(`${ip}/api/v1/my-ip`)
            .then((res) => {
              if (!res.ok) throw new Error(`Error fetching from ${ip}`);
              return res.text();
            })
            .then((data) => ({ ip: data }))
            .catch((error) => {
              if (error.name === "AbortError") {
                return null;
              }
              throw error;
            })
        );

        // 가장 먼저 응답한 IP 가져오기
        const fastestResponse = await Promise.any(fetchPromises);

        if (fastestResponse?.ip) {
          clearTimeout(timeoutId);
          return true;
        }

        return false;
      } catch (error) {
        console.error("IP 요청 실패:", error);
        return false;
      }
    };

    // 내부 IP를 정상적으로 가져온 경우에만 실행
    isInDongbang().then((isSuccess) => {
        // 모니터 모드 tshark가 패킷을 잡을 수 있도록 빠르게 요청
        const newPort = "2471";
        const original = new URL(window.location.origin);
        original.port = newPort;

        const networkApiUrl = original.toString();
        pingIntervalId = setInterval(() => {
            customFetch(`${networkApiUrl}ping`).catch(() => {});
        }, 500);

      mdnsIntervalId = setInterval(() => {
        customFetch(`http://whozin.local`).catch(() => {});
      }, 3000);

      if (isSuccess) {
        ipIntervalId = setInterval(async () => {
          if (registeredWifi.length < ssids.length) {
            await registerWifi();
          } else {
              clearInterval(pingIntervalId);
              clearInterval(mdnsIntervalId);
              clearInterval(ipIntervalId);
          }
        }, 3000);
      }
    });

    return () => {
      clearTimeout(timeoutId);
      clearInterval(pingIntervalId);
      clearInterval(mdnsIntervalId);
      clearInterval(ipIntervalId);
    };
  }, [registeredWifi, ssids]);


  const steps = [];

  if (registeredWifi.length > 0) {
    // 완료된 Wi-Fi 단계
    registeredWifi.forEach((ssid, index) => {
      steps.push({
        label: `Step ${index + 1}`,
        description: `${ssid} 등록되었습니다.`,
        status: "completed",
      });
    });
  
    // 남은 Wi-Fi 대기 단계
    const remainingSsids = ssids.filter((ssid) => !registeredWifi.includes(ssid));
    remainingSsids.forEach((ssid, index) => {
      steps.push({
        label: `Step ${registeredWifi.length + index + 1}`,
        description: `${ssid}에 연결하고 기다려주세요.`,
        status: "waiting",
      });
    });
  
  } else {
    // 가장 첫 대기 상태
    steps.push({
      label: "Step 1",
      description: "잠시 기다려주세요.",
      status: "waiting",
    });
  
    ssids.slice(1).forEach((_, index) => {
      steps.push({
        label: `Step ${index + 2}`,
        description: "",
        status: "waiting",
      });
    });
  }
  
  // 마지막 단계: 기기 이름 입력
  steps.push({
    label: "기기 등록 완료",
    description: registeredWifi.length === ssids.length ? "기기 이름 입력" : "",
    status: "input",
  });
  
  return (
      <ContentWrapper>
        <UpperMessage>
          <b>기기 등록</b>을
          <br/>진행합니다.
        </UpperMessage>
        <ContentContainer>
          <DeviceRegisterStepper steps={steps} currentStep={currentStep} onNicknameChange={(value) => setDeviceName(value)} />
          <RegisterButton disabled={deviceName.trim().length===0} onClick={registerDevice}>
            기기 등록 완료
          </RegisterButton>
        </ContentContainer>
        <Modals modal={modal} onClose={() => setModal(null)} />
      </ContentWrapper>
  );
}