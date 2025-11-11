"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, User as UserIcon, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type GenderType = "남" | "여" | "기타" | null;

type User = {
  id: number;
  name: string;
  profile_image?: string;
  gender?: GenderType;
};

function WorldCupProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<"select-user" | "setup-profile">("select-user");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGender, setSelectedGender] = useState<GenderType>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
    // URL에서 userId가 있으면 해당 사용자로 바로 이동
    const userId = searchParams.get("userId");
    if (userId) {
      loadUserById(parseInt(userId));
    }
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/worldcup/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error("사용자 목록 불러오기 실패:", error);
    }
  };

  const loadUserById = async (userId: number) => {
    try {
      const response = await fetch(`/api/worldcup/users/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedUser(data.user);
        setSelectedGender(data.user.gender || null);
        if (data.user.profile_image) {
          setPreviewUrl(data.user.profile_image);
        }
        setStep("setup-profile");
      }
    } catch (error) {
      console.error("사용자 정보 불러오기 실패:", error);
    }
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setSelectedGender(user.gender || null);
    if (user.profile_image) {
      setPreviewUrl(user.profile_image);
    }
    setStep("setup-profile");
    setOpen(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        window.alert("이미지 크기는 5MB 이하여야 합니다.");
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedUser) {
      window.alert("사용자를 선택해주세요.");
      return;
    }

    if (!selectedGender) {
      window.alert("성별을 선택해주세요.");
      return;
    }

    if (!selectedImage && !selectedUser.profile_image) {
      window.alert("프로필 이미지를 업로드해주세요.");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("userId", selectedUser.id.toString());
      formData.append("gender", selectedGender);
      if (selectedImage) {
        formData.append("image", selectedImage);
      }

      const response = await fetch("/api/worldcup/profile", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("프로필 업데이트에 실패했습니다.");
      }

      // window.alert("프로필이 성공적으로 저장되었습니다 서비스는 최소 인원이 등록되면 진행됩니다!");
      router.push(`/dashboard/worldcup?userId=${selectedUser.id}`);
    } catch (error) {
      console.error("프로필 업데이트 오류:", error);
      window.alert("프로필 저장에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (step === "select-user") {
    return (
      <div className="min-h-screen  py-8 px-4">
        <div className="max-w-md mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-primary">
              이상형 월드컵
            </h1>
            <p className="text-muted-foreground">당신은 누구십니까</p>
          </div>

          <Card className="border-primary/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-primary" />
                사용자 선택
              </CardTitle>
              <CardDescription>
                본인의 이름을 선택해주세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                  >
                    {selectedUser ? selectedUser.name : "사용자 선택..."}
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput
                      placeholder="이름 검색..."
                      value={searchTerm}
                      onValueChange={setSearchTerm}
                    />
                    <CommandEmpty>사용자를 찾을 수 없습니다.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-auto">
                      {filteredUsers.map((user) => (
                        <CommandItem
                          key={user.id}
                          value={user.name}
                          onSelect={() => handleUserSelect(user)}
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.profile_image} />
                              <AvatarFallback>{user.name[0]}</AvatarFallback>
                            </Avatar>
                            <span>{user.name}</span>
                            {user.gender && (
                              <span className="text-xs text-muted-foreground">
                                ({user.gender})
                              </span>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* 또는 직접 입력 */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    또는
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>이름 검색</Label>
                <Input
                  placeholder="이름을 입력하세요..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {searchTerm && filteredUsers.length > 0 && (
                <div className="grid gap-2 max-h-64 overflow-auto border rounded-lg p-2">
                  {filteredUsers.slice(0, 10).map((user) => (
                    <Button
                      key={user.id}
                      variant="ghost"
                      className="justify-start h-auto py-2"
                      onClick={() => handleUserSelect(user)}
                    >
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage src={user.profile_image} />
                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{user.name}</span>
                        {user.gender && (
                          <span className="text-xs text-muted-foreground">
                            {user.gender}
                          </span>
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-primary">
            이상형 월드컵
          </h1>
          <p className="text-muted-foreground">
            안녕하세요, <span className="font-bold text-primary">{selectedUser?.name}</span>님!
          </p>
        </div>

        <Card className="border-primary/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-primary" />
              프로필 설정
            </CardTitle>
            <CardDescription>
              이상형 월드컵에 참여하기 위해 프로필 사진과 성별을 설정해주세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 프로필 이미지 업로드 */}
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="w-32 h-32 border-4 border-primary/20">
                <AvatarImage src={previewUrl || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-pink-500/20">
                  <UserIcon className="h-16 w-16 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>

              <div className="w-full">
                <Label
                  htmlFor="image-upload"
                  className="flex items-center justify-center gap-2 w-full cursor-pointer rounded-lg border-2 border-border  bg-secondary py-4 px-6 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
                >
                  <Upload className="h-5 w-5" />
                  {previewUrl ? "이미지 변경" : "이미지 업로드"}
                </Label>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <p className="text-xs text-muted-foreground text-center mt-2">
                  JPG, PNG, GIF (최대 5MB)
                </p>
              </div>
            </div>

            {/* 성별 선택 */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">성별</Label>
              <RadioGroup
                value={selectedGender || ""}
                onValueChange={(value) => setSelectedGender(value as GenderType)}
              >
                <div className="grid grid-cols-3 gap-3">
                  <label
                    className={`flex flex-col items-center justify-center space-y-2 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                      selectedGender === "남"
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-muted hover:border-blue-300"
                    }`}
                  >
                    <RadioGroupItem value="남" id="male" className="sr-only" />
                    <div className="text-3xl">👨</div>
                    <span className="text-sm font-medium">남자</span>
                  </label>

                  <label
                    className={`flex flex-col items-center justify-center space-y-2 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                      selectedGender === "여"
                        ? "border-pink-500 bg-pink-500/10"
                        : "border-muted hover:border-pink-300"
                    }`}
                  >
                    <RadioGroupItem value="여" id="female" className="sr-only" />
                    <div className="text-3xl">👩</div>
                    <span className="text-sm font-medium">여자</span>
                  </label>

                  <label
                    className={`flex flex-col items-center justify-center space-y-2 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                      selectedGender === "기타"
                        ? "border-purple-500 bg-purple-500/10"
                        : "border-muted hover:border-purple-300"
                    }`}
                  >
                    <RadioGroupItem value="기타" id="other" className="sr-only" />
                    <div className="text-3xl">🌈</div>
                    <span className="text-sm font-medium">기타</span>
                  </label>
                </div>
              </RadioGroup>
            </div>

            {/* 버튼 */}
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setStep("select-user");
                  setSelectedUser(null);
                  setSelectedGender(null);
                  setPreviewUrl(null);
                  setSelectedImage(null);
                }}
                variant="outline"
                className="flex-1"
              >
                다른 사용자 선택
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !selectedGender || (!selectedImage && !selectedUser?.profile_image)}
                className="flex-1"
              >
                {isLoading ? "저장 중..." : "저장하고 시작하기"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function WorldCupProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    }>
      <WorldCupProfileContent />
    </Suspense>
  );
}
