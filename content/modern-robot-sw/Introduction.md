

로봇 산업은 매우 넓은 스펙트럼을 가지고 있습니다.  
산업용 로봇을 시작으로, 배달 로봇, 그리고 최근 각광받고 있는 휴머노이드 로봇에 이르기까지 적용 영역과 기술 스택은 매우 다양합니다.

이 블로그에서는 특정 로봇의 형태나 산업군에 국한하지 않고, **현재 로봇 소프트웨어 개발의 근간을 이루는 공통적인 핵심 기술들**을 중심으로 다루고자 합니다.  
기초적인 내용부터 시작하되, 궁극적으로는 **휴머노이드 로봇까지 확장 가능한 소프트웨어 기술 스택**을 깊이 있게 살펴볼 예정입니다.

본 블로그에서는 하드웨어, 특히 기계공학적 설계나 메커니즘에 대한 논의는 다루지 않습니다. 대신 **로봇 엔지니어링 중에서도 소프트웨어 생태계 전반**, 즉 로봇 시스템을 구성하고 서비스로 확장하기 위한 SW 아키텍처와 플랫폼에 집중합니다.

## 기술 컴포넌트

Modern Robot Software는 크게 네 가지 영역이 유기적으로 결합되어 구성됩니다.

- Robot 
- Cloud
- Intelligence
- Digital Twin

아래 그림은 이러한 구조를 개념적으로 나타낸 것입니다.

![[Excalidraw/Drawing-2026-01-03-13.02.00.excalidraw|100%]] 

회색 블록은 본 블로그에서 핵심적으로 다루지 않거나, 필요 시 간략히 언급하는 영역입니다. 이미 다른 자료에서 충분히 다루어지는 내용이기 때문입니다.

### Robot
로봇 개발을 이야기할 때 흔히 이 영역이 가장 강조됩니다.  
다만 실제 서비스 관점에서 보면, 로봇은 전체 시스템의 일부에 해당하는 경우가 더 많습니다. 그럼에도 불구하고 대부분의 로봇은 공통적인 소프트웨어 컴포넌트 구조를 가지고 있습니다.
#### 1. System OS 

로봇을 기동하기 위해서는 운영체제가 필요합니다. 대부분의 로봇은 Linux 기반 OS를 사용하지만, 실시간성이 중요한 경우 RTOS 계열을 사용하는 사례도 존재합니다. 본 블로그에서는 RTOS에 대한 상세한 논의는 다루지 않습니다.

#### 2. Meta OS

System OS 위에는 로봇 소프트웨어 프레임워크가 올라갑니다.  ROS(Robot Operating System)가 대표적인 예이며, 엄밀히 말하면 운영체제가 아니라 **로봇용 미들웨어/소프트웨어 프레임워크**입니다.
이 레이어는 센서, 액추에이터, 제어기와의 연계를 담당하며, 많은 로봇 엔지니어들이 “로봇 소프트웨어”라고 인식하는 핵심 영역이기도 합니다.

- 신규 상용 프로젝트에서는 ROS2가 사실상 표준으로 자리 잡고 있습니다.  
    ([https://www.ros.org/](https://www.ros.org/))
    
- 네이버랩스는 Whale OS 기반의 Arc Mind를 공개 예정이며, 이는 자체 로봇 소프트웨어 플랫폼의 한 축을 담당합니다.  
    ([https://www.naverlabs.com/storyDetail/288](https://www.naverlabs.com/storyDetail/288))

#### 3. Control App

Meta OS를 통해 기본적인 제어 인터페이스가 구성되면,  Control App 레이어는 Fleet 서버와의 통신 및 로봇 제어 로직을 담당합니다.
로봇의 상태 관리, 명령 전달, 미션 실행 제어 등이 이 레이어에서 이루어집니다.

#### 4. AI Model

최근의 로봇에는 자율주행, 행동 생성(Behavior), 상황 인지 등을 담당하는 AI 모델이 탑재됩니다.
이러한 모델은 On-device 혹은 Edge AI 형태로 배치되며,  지연 시간이나 안정성이 중요한 현장 환경에서 핵심적인 역할을 수행합니다.

#### 5. business app

Business App은 로봇 서비스를 실제 비즈니스와 연결하는 레이어입니다.
예를 들어 도시락 배달 서비스의 경우,

- 로봇이 도착해야 할 사용자의 위치를 식별하고
    
- 미션 완료 결과를 상위 서비스로 전달하는 역할을 수행합니다.
    

이 레이어는 로봇의 Control App 위에서 동작하며, 서비스 로직을 담당합니다.

### Cloud(백엔드)

Modern Robot Software 플랫폼에서 백엔드의 역할은 대부분 클라우드에서 수행됩니다.  
Cloud는 Robot 영역과 함께 시스템 전체의 또 하나의 핵심 축이며,  
AI와 Digital Twin을 포함한 **전체 로봇 서비스의 Integrator이자 Orchestrator** 역할을 담당합니다

#### 1. Data Pipeline

ROS2 및 Open-RMF는 DDS(Data Distribution Service)를 기반으로 한 데이터 중심 Pub/Sub 통신 구조를 사용합니다.다만 실제 현업 환경에서는 다양한 제약으로 인해,
- MQ
- Kafka  
와 같은 메시지 및 이벤트 기반 아키텍처가 함께 사용되는 경우가 많습니다.
  
이러한 데이터 파이프라인을 통해 수집된 로봇 데이터는 대규모 스토리지에 적재되며,  
Sensor AI, LLM, VLM/VLA 모델 학습 및 분석에 활용됩니다.

#### 2. Fleet Platform

Fleet Platform은 흔히 관제 솔루션이라고 불리며, 다수의 로봇을 관리하기 위한 핵심 시스템입니다. 단일 로봇 환경에서는 단일 Fleet Platform으로 충분하지만 이기종 멀티 로봇 환경에서는 여러 Fleet Platform 간의 연계가 필요합니다

이 과정에서 MAPF(Multi-Agent Path Finding)는 필수적인 기술 요소입니다.
Fleet Platform의 주요 역할은 다음과 같습니다.

- Monitoring: 로봇의 위치 및 상태 관리
- Control: 로봇 미션 전달
- Building Integration: 자동문, 엘리베이터 등과의 연계 및 최적화

Open-RMF는 ROS 기반 이기종 관제를 지원하는 오픈소스 프로젝트입니다.  
([https://www.open-rmf.org/](https://www.open-rmf.org/))

네이버랩스는 ARC Brain을 통해 이기종 관제 기능을 제공하고 있으며,  
네이버 클라우드 서비스로도 제공되고 있습니다.  
([https://guide.ncloud-docs.com/docs/arc-brain-overview](https://guide.ncloud-docs.com/docs/arc-brain-overview))

#### 3. Robot Service 

Robot Service 레이어는 카페, 배달, 이동 서비스 등 실제 로봇 서비스를 구현하는 영역입니다.
이 레이어에서는
- 메신저 연계
- 챗봇 연계
- 외부 시스템 연계  
등이 이루어지며, 로봇의 Business App과 직접 연결됩니다.

#### 4. App Store

많은 로봇 기업들이 플랫폼 전략을 취하고 있으며,  그 일환으로 App Store 형태의 생태계를 구축하려 하고 있습니다.

이를 통해 로봇 및 클라우드 상에서 비즈니스 로직을 자유롭게 확장할 수 있는 구조를 지향합니다.


### Intelligence

바야흐로 대 AI 시대입니다. 결국 스마트한 로봇을 활용하려면 Intelligence 를 통한 최적화가 이 산업의 미래를 열어줄 것입니다. Physical AI 라고 하는 대부분의 내용이 여기 있습니다.

#### 1. Sensor AI

로봇들은 센서들을 많이 가지고 있습니다. 이 센서들을 데이터 파이프라인을 통해 서버로 보내면, sensor 데이터를 이용해 ML부터 GenAI 까지 다양한 작업들을 할 수 있습니다. 예를 들면 열화상 카메라 혹은 소음 센서들을 사용하는 방법들이 있습니다. 
통계학적인 방법들이 아직은 더 유용할 수 있습니다. 하지만 몇가지 분야에서는 이미 AI들이 많이 사용되고 있습니다.

#### 2. VLA/VLM

로봇이 가지고 있는 카메라 혹은 라이다 센서를 통해서 수집된 데이터들은 여러 경로로 사용됩니다. 카메라를 이용한 Vision AI들은 워낙 광범위 합니다. VLM은 그 중에서도 사람이 쓰러져 있다던지의 위험감지, 복잡한 통로라는 것을 파악한다던지 등의 분야에 활용될 수 있습니다. Action 까지 바로 진행되는 모델의 경우 VLA로 이어져서 많은 분야에서 활용됩니다.

#### 3. LLM

로봇과 챗봇의 Integration 은 언제나 재밌는 주제입니다. 인터페이스를 Verbal로 할 수도 있고 스마트폰 Chat UI를 통해 메세지를 통해서 주고 받을 수 있습니다.
이 외에도 결국 Fleet Management의 미래도 AI 를 통해 더 강화될 수 있는데, 그 부분은 차차 다뤄 보도록 하겠습니다.

### Digital Twin

Physical AI를 가능하게 하는 가장 중요한 요소 중에 하나가 Digital Twin 입니다. 모든 물리적 상황을 Real World에서 다 테스트 할 때의 비용을 생각하면 구축된 Digital Twin에서 상황을 테스트 해보고 물리적인 결과들이 어떻게 벌어지게 할 지 등을 살펴보는 것이 더 현실적(Realistic)인 방법입니다.

#### 1. SLAM

로봇은 지도를 통해서 움직입니다. 이 지도는 미리 측량되어서 로봇에 탑재되어야 하고 현재 위치를 기존 지도에서 찾아내는 방법이 필요합니다. 이것을 Localization and Mapping이라고 하는데, 로봇 공학에서 사용하는 방법이 Simultaneous Localization and Mapping, 즉 SLAM입니다.

#### 2. 3D HD Map

자율 주행을 위해서 Lidar를 통해 데이터를 수집하면 Point Cloud 라고 하는 데이터를 얻을 수 있습니다. 이 PCD를 단층으로 자르면 2D Map으로 변환이 가능하고 3D를 집합시키면 3D 지도를 얻을 수 있습니다. 
이 3D 지도의 집적도가 더 높을 수록 자율 주행 및 로봇이 주행하는 경로를 더 촘촘하게 설계할 수 있습니다.

#### 3. World Model

World Model은  AI가 텍스트나 이미지를 넘어 현실 세계의 물리 법칙, 공간, 시간, 인과 관계 등을 이해하고 시뮬레이션하여 미래를 예측하는 지능형 시스템으로 Physics 모델이 각 오브젝트에 담겨져 있습니다.
Nvidia는 Cosmos라는 World 모델을 내 놓았고 github 레포지토리에서 찾아 볼 수 있습니다. https://github.com/nvidia-cosmos 
Nvidia Omniverse 샘플을 다음에서 확인해 볼 수 있습니다.  https://youtu.be/gPaFgNEF82Q?si=Vu9IfJZxIJdkmdl6 

#### 4. Simulator

결국 로봇의 특정행동에 대한 시뮬레이션은 제품을 만들고 모델의 정합성을 확인하는데 필수입니다.
Nvidia Issam Sim 이 그 좋은 예입니다.