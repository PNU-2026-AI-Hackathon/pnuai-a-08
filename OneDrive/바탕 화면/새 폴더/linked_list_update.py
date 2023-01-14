class Node:
    def __init__(self, data, next=None):
        self.data = data
        self.next = next


def add(data):
    node = head
    while node.next:
        node = node.next
    node.next = Node(data) 

node1 = Node(1) # node1.data=1, node1.next=None 인 상태
head = node1    # 이게 된다. --> 위의 함수 정의의 당시에는 head가 없었는데 밑에서 선언을 해도 문법상 문제가 없다 
for index in range(2, 10):
    add(index)

# 추가 기능 구현에서는 이 부분까지 이용합니다.

node = head
while node.next:
    print(node.data)
    node = node.next
print (node.data)

# 문제 1 : 현재 상태의 링크드 리스트를 안다고 가정할 떄 1.5를 자신의 데이터로 가지는 
# 링크드 리스트를 새로 만들기

node3=Node(1.5)

node = head # head 는 데이터가 1인 상태로 정의되어있다.

while node.data:
    if node.data == 1:
        node_tempo = node.next
        node.next = node3
        node3.next = node_tempo
    else:
        node = node.next

# 문제 2 : 링크드 리스트의 핵심 기능인 1. 전체 출력(desc) , 2. 데이터 추가(add)
# 를 가능케 하는 새로운 객체인 nodemanagment를 구현 후 실행

 
class Node:

    def _init_(self,data,next=None):
        self.data = data
        self.next = next
        
    # 일단 객체를 생성을 해야 더 데이터를 만들던지 말던지 하니까

class nodemangment:
    
    def _init_(self,data):
        self.head=Node(data)
    
    def add(self,add_data): # 객체 생성 당시 self 작성은 모든 메서드( _init_ 포함)에서 필수

        node = self.head

        if(self.head ==None): # 다른 말로 self.head == ''
            self.head = Node(add_data)
        else:
            while(node.data):
                node=node.next
            node.next = Node(add_data)

    def desc(self):
        # 별다른 인자가 필요는 없다.
        node = self.head

        while(node.data):
            print(node.data)
            node=node.next

# 추가 기능 구현

    def position_purposing(self,add_data_purposing):

        check_point_small = 0
        check_point_big = 0
        check_true_or_false=[True,True]

        node = self.head

        while(node.data):

            check_point_small = node.data
            node_tempo = node.next
            check_point_big =  node_tempo.data

            if(check_point_small <= add_data_purposing) :
                check_true_or_false[0] = False
          
            if(check_point_big >= add_data_purposing) :
                check_true_or_false[1] = False

            if(check_true_or_false[0] == False and check_true_or_false[1] == False):
                
                node.next = Node(add_data_purposing)
                node_tempo_2 = node.next
                node_tempo_2.next = node_tempo

                break

            node = node.next 



        

            

        
        
    

    

    


    


