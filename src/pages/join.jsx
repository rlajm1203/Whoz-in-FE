import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { FaAngleLeft } from "react-icons/fa" 
import { Input, Button, Container } from "../components/StyledComponents/AuthStyles"
import styled from "styled-components"
import members from "../data/sampleData" // 회원 정보 데이터
import GenerationsDropdown, {StyledSelect} from "../components/GenerationSelect"

const ScrollContainer = styled.div`

    flex-direction: column;
    overflow: hidden;
    transition: all 0.7s ease;
    transform: ${({ showSecondStep }) => (showSecondStep ? "translateY(-60%)" : "translateY(0)")}; /* 첫 번째 페이지는 아래로, 두 번째 페이지는 위로 */
    height: 100%;
`


//TODO: 페이지 예쁘게 넘어가게 처리 다시하기  (12/25)

const Join = () => {
    const navigate = useNavigate()

    // 첫번째 페이지에서 받을 정보
    const [name, setName] = useState("")  
    const [loginid, setLoginId] = useState("")  
    const [password, setPassword] = useState("")  
    const [confirmPassword, setConfirmPassword] = useState("")  

    // 스크롤 넘어가고 받을 정보
    const [showSecondStep, setShowSecondStep] = useState(false)
    const [generation, setGeneration] = useState("") // 기수
    const [position, setPosition] = useState("") // 분야


    const handleJoin = () => {
        if (password !== confirmPassword) {
            alert("비밀번호가 일치하지 않습니다.")
            return
        }

    // 새로운 회원 정보 생성
    const newMember = {
        id: members.length, // 회원가입과 동시에 고유 ID 부여
        name,
        loginid,
        password,
        generation,
        position,
      };
  
      // 회원 데이터 배열에 추가
      members.push(newMember);

      alert('회원가입이 완료되었습니다!');

        // 가입 완료 후 로그인 페이지로 이동
        navigate("/login")
    }

    const handleNext = () => {

        setShowSecondStep(true)
    }

    const handlePrevious = () => {
        setShowSecondStep(false)
    }

    return (
        <Container>
            <ScrollContainer showSecondStep={showSecondStep}>
            <Input
                    type="text"
                    placeholder="이름"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <Input
                    type="text"
                    placeholder="ID (로그인 아이디)"
                    value={loginid}
                    onChange={(e) => setLoginId(e.target.value)}
                />
                <Input
                    type="password"
                    placeholder="비밀번호"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <Input
                    type="password"
                    placeholder="비밀번호 확인"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <Button onClick={handleNext}>다음</Button>

                {/* 두 번째 페이지 */}
                {showSecondStep && (
                    <>
                    
                    <Button onClick={handlePrevious}>
                            <FaAngleLeft /> 이전
                        </Button>

                        <GenerationsDropdown
                            generation={generation}
                            setGeneration={setGeneration}
                        />

                        <div>
                            
                            <StyledSelect
                                id="position"
                                value={position}
                                onChange={(e) => setPosition(e.target.value)}
                            >
                                <option value="">분야</option>
                                <option value="BE">BE</option>
                                <option value="FE">FE</option>
                                <option value="AOS">AOS</option>
                                <option value="IOS">iOS</option>
                                <option value="AI">AI</option>
                                <option value="GAME">GAME</option>
                            </StyledSelect>
                        </div>

                        <Button onClick={handleJoin}>회원가입</Button>
                    </>
                )}
            
            </ScrollContainer>
        </Container>
    )
}
//TODO: 반응형 따라 회원가입 버튼 안 보이는 거 수정
export default Join